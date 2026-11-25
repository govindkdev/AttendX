import base64
import json
import math
import os
from pathlib import Path
from typing import Tuple, Optional, List, Dict, Any

import cv2
import numpy as np

from app.core.config import settings

class FaceProcessingService:
    """
    Enterprise Biometric Face Processing Service for AttendX.
    Uses InsightFace (RetinaFace / SCRFD + ArcFace buffalo_l) and MiniFASNet V2 ONNX for PAD.
    Enforces fail-closed Presentation Attack Detection and 1:N Global Identity Verification.
    """

    def __init__(self):
        self.similarity_threshold = settings.FACE_SIMILARITY_THRESHOLD
        self.ambiguity_margin = settings.FACE_AMBIGUITY_MARGIN
        self.pad_threshold = settings.PAD_THRESHOLD
        self.det_confidence = settings.FACE_DET_CONFIDENCE
        self.multi_frame_similarity = settings.FACE_MULTI_FRAME_SIMILARITY

        self._app = None
        self._pad_session = None
        self._pad_initialized = False

    def _get_insightface_app(self):
        """
        Lazily initializes InsightFace FaceAnalysis singleton.
        """
        if self._app is None:
            try:
                import insightface
                from insightface.app import FaceAnalysis

                app = FaceAnalysis(
                    name=settings.INSIGHTFACE_MODEL_NAME,
                    providers=["CPUExecutionProvider"]
                )
                app.prepare(ctx_id=-1, det_size=(640, 640))
                self._app = app
            except Exception as e:
                print(f"[FaceService] Warning: Failed to initialize InsightFace: {e}")
                self._app = None
        return self._app

    def _get_pad_session(self):
        """
        Lazily initializes ONNX Runtime session for MiniFASNet V2 Presentation Attack Detection.
        Fail-closed: Returns None if model file does not exist or fails to load.
        """
        if not self._pad_initialized:
            self._pad_initialized = True
            model_path = Path(settings.PAD_MODEL_PATH)
            # Fallback path check
            if not model_path.exists():
                fallback = Path(settings.FACE_MODEL_DIR) / "anti_spoof.onnx"
                if fallback.exists():
                    model_path = fallback

            if model_path.exists():
                try:
                    import onnxruntime as ort
                    self._pad_session = ort.InferenceSession(
                        str(model_path),
                        providers=["CPUExecutionProvider"]
                    )
                except Exception as e:
                    print(f"[FaceService] Warning: Failed to load PAD ONNX model: {e}")
                    self._pad_session = None
            else:
                print(f"[FaceService] PAD model not found at {model_path}. Fail-closed policy active.")
                self._pad_session = None
        return self._pad_session

    @staticmethod
    def decode_image(image_input: str | bytes) -> Optional[np.ndarray]:
        """
        Decodes a base64 string, data URI, or raw bytes into a BGR OpenCV image.
        """
        try:
            if isinstance(image_input, str):
                if "," in image_input:
                    image_input = image_input.split(",", 1)[1]
                # Fix padding if necessary
                missing_padding = len(image_input) % 4
                if missing_padding:
                    image_input += "=" * (4 - missing_padding)
                raw_bytes = base64.b64decode(image_input)
            else:
                raw_bytes = image_input

            nparr = np.frombuffer(raw_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return img
        except Exception as e:
            print(f"[FaceService] Error decoding image: {e}")
            return None

    @staticmethod
    def assess_quality(img: np.ndarray, min_wh: int = 80) -> Tuple[bool, float, str]:
        """
        Validates lighting, resolution, and blurriness of an image frame.
        Returns (is_acceptable, quality_score, reason).
        """
        if img is None or img.size == 0:
            return False, 0.0, "Empty or invalid image frame provided."

        h, w = img.shape[:2]
        if h < 120 or w < 120:
            return False, 0.0, f"Resolution too low ({w}x{h}). Minimum required is 120x120."

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 1. Lighting / Exposure check
        mean_brightness = float(np.mean(gray))
        if mean_brightness < 35.0:
            return False, mean_brightness, "Lighting is too dark. Please move to a brighter environment."
        if mean_brightness > 240.0:
            return False, mean_brightness, "Lighting is overexposed. Please avoid direct glare or flash."

        # 2. Blur check via Laplacian variance
        blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
        if blur_score < 25.0:
            return False, float(blur_score), "Image is too blurry. Please hold steady and ensure good focus."

        # Quality score normalized to [0.0, 1.0]
        quality = min(1.0, max(0.4, (blur_score / 150.0) * 0.5 + (1.0 - abs(mean_brightness - 128.0) / 128.0) * 0.5))
        return True, round(quality, 3), "Image quality is good."

    def detect_faces(self, img: np.ndarray) -> Tuple[bool, List[Any], str]:
        """
        Detects faces in frame using InsightFace SCRFD/RetinaFace.
        Enforces EXACTLY ONE face requirement and checks pose/quality.
        Returns (is_success, faces, message).
        """
        app = self._get_insightface_app()
        if app is None:
            return False, [], "InsightFace recognition engine is not initialized."

        try:
            detected_faces = app.get(img)
        except Exception as e:
            return False, [], f"Face detection pipeline error: {str(e)}"

        # Filter by detection confidence
        valid_faces = [f for f in detected_faces if getattr(f, "det_score", 1.0) >= self.det_confidence]

        # Check face count
        if len(valid_faces) == 0:
            return False, [], "No face detected in camera viewport. Please face the camera directly."

        if len(valid_faces) > 1:
            return False, valid_faces, f"Multiple faces detected in camera viewport ({len(valid_faces)}). Exactly one person must be present."

        face = valid_faces[0]

        # Check bounding box dimensions
        bbox = face.bbox.astype(int)
        box_w = bbox[2] - bbox[0]
        box_h = bbox[3] - bbox[1]
        if box_w < 80 or box_h < 80:
            return False, valid_faces, f"Face region too small ({box_w}x{box_h}). Please move closer to the camera."

        # Check head pose if available (yaw, pitch, roll within +/- 35 degrees)
        pose = getattr(face, "pose", None)
        if pose is not None and len(pose) >= 3:
            pitch, yaw, roll = pose[0], pose[1], pose[2]
            if abs(yaw) > 35.0 or abs(pitch) > 35.0:
                return False, valid_faces, "Face angle too steep. Please look directly into the camera."

        return True, valid_faces, "Single valid face detected."

    def _get_normalized_embedding(self, face: Any) -> Optional[List[float]]:
        """
        Extracts L2-normalized 512-dimensional ArcFace embedding from an InsightFace face object.
        """
        normed = getattr(face, "normed_embedding", None)
        if normed is not None and len(normed) == 512:
            return [float(x) for x in normed]

        raw = getattr(face, "embedding", None)
        if raw is not None and len(raw) == 512:
            norm = np.linalg.norm(raw)
            if norm > 1e-6:
                return [float(x) for x in (raw / norm)]
        return None

    def extract_face_embedding(self, img: np.ndarray) -> Tuple[bool, Optional[List[float]], str]:
        """
        Detects face, validates quality and single-face constraint, and extracts 512-d normalized embedding.
        """
        is_ok, quality, reason = self.assess_quality(img)
        if not is_ok:
            return False, None, reason

        ok_det, faces, det_msg = self.detect_faces(img)
        if not ok_det:
            return False, None, det_msg

        face = faces[0]
        emb = self._get_normalized_embedding(face)
        if emb is None:
            return False, None, "Failed to extract ArcFace biometric embedding from detected face."

        return True, emb, "Face embedding extracted successfully."

    def check_liveness_pad(
        self,
        img: np.ndarray,
        bbox: Optional[List[int]] = None
    ) -> Tuple[bool, float, str]:
        """
        Presentation Attack Detection (PAD) using MiniFASNet V2 ONNX.
        Detects printed photo, mobile screen replay, and video playback attacks.
        Fail-Closed: If model is missing or fails, rejects attendance with is_live=False.
        Returns (is_live, confidence_score, message).
        """
        session = self._get_pad_session()
        if session is None:
            return False, 0.0, "PAD anti-spoofing model unavailable or failed to initialize (fail-closed)."

        if img is None or img.size == 0:
            return False, 0.0, "Invalid image for PAD analysis."

        src_h, src_w = img.shape[:2]

        # If bbox is not provided, locate face via InsightFace or center crop
        if bbox is None:
            ok_det, faces, _ = self.detect_faces(img)
            if ok_det and faces:
                bbox = faces[0].bbox.astype(int).tolist()
            else:
                # Default centered region if detector fails
                margin_y = int(src_h * 0.15)
                margin_x = int(src_w * 0.15)
                bbox = [margin_x, margin_y, src_w - margin_x, src_h - margin_y]

        x1, y1, x2, y2 = bbox[0], bbox[1], bbox[2], bbox[3]
        box_w = max(1, x2 - x1)
        box_h = max(1, y2 - y1)

        # Scale crop 2.7x per Silent-Face-Anti-Spoofing specification
        scale = min((src_h - 1) / box_h, min((src_w - 1) / box_w, 2.7))
        new_w = box_w * scale
        new_h = box_h * scale
        center_x = x1 + box_w / 2.0
        center_y = y1 + box_h / 2.0

        left = max(0, int(center_x - new_w / 2.0))
        top = max(0, int(center_y - new_h / 2.0))
        right = min(src_w, int(center_x + new_w / 2.0))
        bottom = min(src_h, int(center_y + new_h / 2.0))

        crop = img[top:bottom, left:right]
        if crop.size == 0:
            return False, 0.0, "Face crop failed for PAD analysis."

        try:
            # Resize to 80x80 NCHW float32 [0.0, 1.0] BGR
            resized = cv2.resize(crop, (80, 80))
            blob = resized.astype(np.float32) / 255.0
            blob = np.transpose(blob, (2, 0, 1)) # HWC to CHW
            blob = np.expand_dims(blob, axis=0) # Shape: (1, 3, 80, 80)

            input_name = session.get_inputs()[0].name
            outputs = session.run(None, {input_name: blob})[0]

            # Softmax over 3 classes: [print_attack, real_face, replay_attack]
            exp_vals = np.exp(outputs - np.max(outputs, axis=1, keepdims=True))
            probs = exp_vals / np.sum(exp_vals, axis=1, keepdims=True)

            pred_class = int(np.argmax(probs[0]))
            live_score = float(probs[0][1])

            # Class 1 is real/live face
            if pred_class == 1 and live_score >= self.pad_threshold:
                return True, round(live_score, 4), f"Liveness verified (confidence: {live_score * 100:.1f}%)."
            else:
                attack_type = "printed photograph attack" if pred_class == 0 else "screen/replay attack"
                return False, round(live_score, 4), f"Presentation attack detected ({attack_type}, live score {live_score:.3f} below threshold {self.pad_threshold})."

        except Exception as e:
            return False, 0.0, f"PAD inference failed: {str(e)} (fail-closed)."

    def verify_multi_frame_consistency(
        self,
        frames: List[np.ndarray]
    ) -> Tuple[bool, Optional[List[float]], str]:
        """
        Enforces temporal multi-frame biometric consistency across consecutive camera frames.
        Validates quality, single-face detection, PAD anti-spoofing, and pairwise embedding identity.
        Returns (is_consistent, consensus_centroid_embedding, message).
        """
        if not frames:
            return False, None, "No camera frames provided for multi-frame verification."

        embeddings = []
        for idx, frame in enumerate(frames):
            ok_q, _, q_msg = self.assess_quality(frame)
            if not ok_q:
                return False, None, f"Frame {idx + 1} quality rejected: {q_msg}"

            ok_det, faces, det_msg = self.detect_faces(frame)
            if not ok_det:
                return False, None, f"Frame {idx + 1}: {det_msg}"

            face = faces[0]
            bbox = face.bbox.astype(int).tolist()

            is_live, pad_score, pad_msg = self.check_liveness_pad(frame, bbox=bbox)
            if not is_live:
                return False, None, f"Frame {idx + 1}: {pad_msg}"

            emb = self._get_normalized_embedding(face)
            if emb is None:
                return False, None, f"Frame {idx + 1}: Failed to extract biometric embedding."
            embeddings.append(emb)

        # Check temporal pairwise cosine consistency
        for i in range(len(embeddings) - 1):
            sim = self.compute_similarity(embeddings[i], embeddings[i + 1])
            if sim < self.multi_frame_similarity:
                return False, None, f"Multi-frame identity inconsistency: frames {i + 1} and {i + 2} similarity ({sim:.3f}) below threshold ({self.multi_frame_similarity}). Possible presentation switch."

        # Compute consensus centroid embedding
        arr = np.array(embeddings, dtype=np.float32)
        mean_vec = np.mean(arr, axis=0)
        norm = np.linalg.norm(mean_vec)
        if norm > 1e-6:
            mean_vec = mean_vec / norm
        return True, mean_vec.tolist(), "Multi-frame biometric verification confirmed."

    def compute_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """
        Computes cosine similarity between two normalized vectors:
        Cosine Sim = dot(u, v) / (||u|| * ||v||)
        Handles both 128-d (legacy) and 512-d (ArcFace) vectors.
        """
        v1 = np.array(vec1, dtype=np.float32)
        v2 = np.array(vec2, dtype=np.float32)

        if v1.shape != v2.shape:
            return 0.0

        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)

        if norm1 < 1e-6 or norm2 < 1e-6:
            return 0.0

        dot = np.dot(v1, v2)
        sim = dot / (norm1 * norm2)
        return float(max(0.0, min(1.0, sim)))

    def match_embedding_against_template(
        self,
        query_vec: List[float],
        template_data: Any
    ) -> float:
        """
        Compares query embedding against an enrolled student's biometric template.
        Supports:
        - Multi-exemplar JSON template: {"centroid": [...512], "samples": [[...512], ...]}
        - Legacy/single vector: [...128] or [...512]
        Returns max cosine similarity score.
        """
        if isinstance(template_data, str):
            try:
                template_data = json.loads(template_data)
            except Exception:
                return 0.0

        if isinstance(template_data, dict):
            scores = []
            centroid = template_data.get("centroid")
            if centroid and len(centroid) == len(query_vec):
                scores.append(self.compute_similarity(query_vec, centroid))

            samples = template_data.get("samples", [])
            for sample_vec in samples:
                if len(sample_vec) == len(query_vec):
                    scores.append(self.compute_similarity(query_vec, sample_vec))

            return max(scores) if scores else 0.0

        elif isinstance(template_data, list):
            if len(template_data) == len(query_vec):
                return self.compute_similarity(query_vec, template_data)

        return 0.0

    def identify_1_to_n(
        self,
        live_embedding: List[float],
        gallery: Dict[int, Any]
    ) -> Tuple[Optional[int], float, float, bool, str]:
        """
        Performs 1:N Global Biometric Matching across all enrolled student templates.
        Identifies:
        - Top-1 candidate (best match) and its score
        - Top-2 candidate (runner-up) and its score
        - Ambiguity check: (score_1 - score_2) < ambiguity_margin
        - Threshold check: score_1 >= similarity_threshold

        Returns (recognized_student_id, top_score, second_score, is_ambiguous, reason).
        """
        if not gallery:
            return None, 0.0, 0.0, False, "Gallery is empty. No enrolled student templates found."

        scored_candidates = []
        for student_id, template_payload in gallery.items():
            score = self.match_embedding_against_template(live_embedding, template_payload)
            scored_candidates.append((student_id, score))

        # Sort descending by match score
        scored_candidates.sort(key=lambda x: x[1], reverse=True)

        top_id, top_score = scored_candidates[0]
        second_score = scored_candidates[1][1] if len(scored_candidates) > 1 else 0.0

        # Check threshold
        if top_score < self.similarity_threshold:
            return None, top_score, second_score, False, f"Unknown face: similarity {top_score:.3f} below threshold {self.similarity_threshold}."

        # Check ambiguity
        if len(scored_candidates) > 1 and (top_score - second_score) < self.ambiguity_margin:
            return top_id, top_score, second_score, True, f"Ambiguous face match: candidate {top_id} ({top_score:.3f}) and runner-up ({second_score:.3f}) separated by less than margin {self.ambiguity_margin}."

        return top_id, top_score, second_score, False, "Identity verified successfully."

    def verify_face(
        self,
        captured_frame: str | bytes,
        stored_template_json: str
    ) -> Tuple[bool, float, str]:
        """
        Verifies a captured face frame against a student's stored template.
        Retained for backward-compatibility with direct 1:1 tests.
        Returns (is_matched, similarity_score, message).
        """
        img = self.decode_image(captured_frame)
        if img is None:
            return False, 0.0, "Invalid image frame. Could not decode."

        ok, captured_vec, msg = self.extract_face_embedding(img)
        if not ok or not captured_vec:
            return False, 0.0, msg

        # Run PAD check
        is_live, pad_score, pad_msg = self.check_liveness_pad(img)
        if not is_live:
            return False, pad_score, f"Liveness check failed: {pad_msg}"

        try:
            stored_data = json.loads(stored_template_json)
        except Exception:
            return False, 0.0, "Stored face template corrupted."

        similarity = self.match_embedding_against_template(captured_vec, stored_data)
        is_match = similarity >= self.similarity_threshold

        if is_match:
            return True, round(similarity, 4), f"Face verified successfully (confidence: {similarity * 100:.1f}%)."
        else:
            return False, round(similarity, 4), f"Face verification failed: confidence {similarity * 100:.1f}% below threshold {self.similarity_threshold * 100:.1f}%."

face_service = FaceProcessingService()
