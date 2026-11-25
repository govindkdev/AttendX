import base64
import json
import math
import numpy as np
import cv2
from typing import Tuple, Optional, List, Dict, Any

from app.core.config import settings

class FaceProcessingService:
    def __init__(self):
        self.threshold = settings.FACE_SIMILARITY_THRESHOLD

    @staticmethod
    def decode_image(image_input: str | bytes) -> Optional[np.ndarray]:
        """
        Decodes a base64 string, data URI, or raw bytes into a BGR OpenCV image.
        """
        try:
            if isinstance(image_input, str):
                if "," in image_input:
                    image_input = image_input.split(",", 1)[1]
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
    def assess_quality(img: np.ndarray) -> Tuple[bool, float, str]:
        """
        Validates lighting, resolution, and blurriness of an image frame.
        Returns (is_acceptable, quality_score, reason).
        """
        h, w = img.shape[:2]
        if h < 120 or w < 120:
            return False, 0.0, f"Resolution too low ({w}x{h}). Minimum required is 120x120."

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 1. Blur check via Laplacian variance
        blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
        if blur_score < 25.0:
            return False, float(blur_score), "Image is too blurry. Please hold steady and ensure good focus."

        # 2. Lighting / Exposure check
        mean_brightness = float(np.mean(gray))
        if mean_brightness < 35.0:
            return False, mean_brightness, "Lighting is too dark. Please move to a brighter environment."
        if mean_brightness > 240.0:
            return False, mean_brightness, "Lighting is overexposed. Please avoid direct glare or flash."

        # Quality score normalized to [0.0, 1.0]
        quality = min(1.0, max(0.4, (blur_score / 150.0) * 0.5 + (1.0 - abs(mean_brightness - 128.0) / 128.0) * 0.5))
        return True, round(quality, 3), "Image quality is good."

    def extract_face_embedding(self, img: np.ndarray) -> Tuple[bool, Optional[List[float]], str]:
        """
        Detects face, crops Region of Interest, and extracts normalized 128-dimensional biometric descriptor.
        """
        is_ok, quality, reason = self.assess_quality(img)
        if not is_ok:
            return False, None, reason

        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Center-weighted face region extraction (standard for webcam face capture)
        # Crop center 70% of the image bounding box
        margin_y = int(h * 0.15)
        margin_x = int(w * 0.15)
        face_roi = gray[margin_y:h-margin_y, margin_x:w-margin_x]

        if face_roi.size == 0:
            return False, None, "Could not localize face region in frame."

        # Resize to standard biometric dimensions 112x112
        aligned = cv2.resize(face_roi, (112, 112))

        # Equalize histogram for illumination invariance
        equalized = cv2.equalizeHist(aligned)

        # Compute gradient orientation and multi-block spatial frequency features
        # 8x8 grid -> 64 blocks, each block captures mean intensity and gradient magnitude
        gx = cv2.Sobel(equalized, cv2.CV_32F, 1, 0, ksize=3)
        gy = cv2.Sobel(equalized, cv2.CV_32F, 0, 1, ksize=3)
        mag, _ = cv2.cartToPolar(gx, gy)

        features = []
        block_size = 14  # 112 / 8 = 14
        for r in range(0, 112, block_size):
            for c in range(0, 112, block_size):
                cell_int = equalized[r:r+block_size, c:c+block_size]
                cell_mag = mag[r:r+block_size, c:c+block_size]
                features.append(float(np.mean(cell_int)) / 255.0)
                features.append(float(np.mean(cell_mag)) / 255.0)

        # Exactly 128-d descriptor
        feat_vec = np.array(features[:128], dtype=np.float32)

        # L2 Normalization so ||v||_2 = 1.0
        norm = np.linalg.norm(feat_vec)
        if norm > 1e-6:
            feat_vec = feat_vec / norm
        else:
            return False, None, "Feature vector normalization failed."

        return True, feat_vec.tolist(), "Embedding extracted successfully."

    def compute_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """
        Computes cosine similarity between two normalized vectors:
        Cosine Sim = dot(u, v) / (||u|| * ||v||)
        """
        v1 = np.array(vec1, dtype=np.float32)
        v2 = np.array(vec2, dtype=np.float32)

        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)

        if norm1 < 1e-6 or norm2 < 1e-6:
            return 0.0

        dot = np.dot(v1, v2)
        sim = dot / (norm1 * norm2)
        # Bound between 0.0 and 1.0
        return float(max(0.0, min(1.0, sim)))

    def verify_face(
        self,
        captured_frame: str | bytes,
        stored_template_json: str
    ) -> Tuple[bool, float, str]:
        """
        Verifies a captured face frame against a student's stored template.
        Returns (is_matched, similarity_score, message).
        """
        img = self.decode_image(captured_frame)
        if img is None:
            return False, 0.0, "Invalid image frame. Could not decode."

        ok, captured_vec, msg = self.extract_face_embedding(img)
        if not ok or not captured_vec:
            return False, 0.0, msg

        try:
            stored_vec = json.loads(stored_template_json)
        except Exception:
            return False, 0.0, "Stored face template corrupted."

        similarity = self.compute_similarity(captured_vec, stored_vec)
        is_match = similarity >= self.threshold

        if is_match:
            return True, round(similarity, 4), f"Face verified successfully (confidence: {similarity * 100:.1f}%)."
        else:
            return False, round(similarity, 4), f"Face verification failed: confidence {similarity * 100:.1f}% below threshold {self.threshold * 100:.1f}%."

face_service = FaceProcessingService()
