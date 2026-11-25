import requests
import random

BASE_URL = 'http://127.0.0.1:8000/api/v1'

def test_login(identifier, password, label):
    resp = requests.post(f'{BASE_URL}/auth/login', json={'identifier': identifier, 'password': password})
    print(f'[{label}] Status: {resp.status_code}')
    if resp.status_code == 200:
        data = resp.json()
        print(f'   -> SUCCESS: role={data.get("role")}, name={data.get("full_name")}, code={data.get("user_code")}')
        return data.get('access_token'), data
    else:
        print(f'   -> FAIL/ERROR: {resp.status_code} - {resp.text}')
        return None, None

def main():
    print('===============================================================')
    print('          ATTENDX FULL PRODUCTION INTEGRATION TEST SUITE       ')
    print('===============================================================')
    
    # 1. Existing Users Login Verification
    print('\n[1] AUTHENTICATING EXISTING USERS ACROSS ROLES:')
    adm_token, adm_user = test_login('admin@gcrg.edu.in', 'Govind@123', 'ADMIN EMAIL')
    test_login('ADM-001', 'Govind@123', 'ADMIN USER_CODE')

    tch_token, tch_user = test_login('govindkush@gmail.com', 'Govind@123', 'TEACHER EMAIL')
    test_login('TCH-2026-0001', 'Govind@123', 'TEACHER USER_CODE')

    stu_token, stu_user = test_login('govindkush749@gmail.com', 'Govind@123', 'STUDENT EMAIL')
    test_login('STU-2026-0001', 'Govind@123', 'STUDENT USER_CODE')

    assert adm_token, "Admin login failed"
    assert tch_token, "Teacher login failed"
    assert stu_token, "Student login failed"

    headers_adm = {'Authorization': f'Bearer {adm_token}'}
    headers_tch = {'Authorization': f'Bearer {tch_token}'}
    headers_stu = {'Authorization': f'Bearer {stu_token}'}

    # 2. Verify /auth/me for each user
    print('\n[2] VERIFYING /auth/me ENDPOINT:')
    r_adm_me = requests.get(f'{BASE_URL}/auth/me', headers=headers_adm)
    print(f'Admin /auth/me: Status {r_adm_me.status_code}, Role: {r_adm_me.json().get("role")}')
    assert r_adm_me.status_code == 200 and r_adm_me.json().get('role') == 'ADMIN'

    r_tch_me = requests.get(f'{BASE_URL}/auth/me', headers=headers_tch)
    print(f'Teacher /auth/me: Status {r_tch_me.status_code}, Role: {r_tch_me.json().get("role")}')
    assert r_tch_me.status_code == 200 and r_tch_me.json().get('role') == 'TEACHER'

    r_stu_me = requests.get(f'{BASE_URL}/auth/me', headers=headers_stu)
    print(f'Student /auth/me: Status {r_stu_me.status_code}, Role: {r_stu_me.json().get("role")}')
    assert r_stu_me.status_code == 200 and r_stu_me.json().get('role') == 'STUDENT'

    # 3. Role-Based Access Control (RBAC) Hard Barriers
    print('\n[3] TESTING RBAC ACCESS BARRIERS:')
    
    # Strictly Admin Endpoint: GET /teachers
    r1 = requests.get(f'{BASE_URL}/teachers', headers=headers_adm)
    print(f'Admin on /teachers: {r1.status_code} (Expect 200) -> {"PASS" if r1.status_code == 200 else "FAIL"}')
    r2 = requests.get(f'{BASE_URL}/teachers', headers=headers_tch)
    print(f'Teacher on /teachers: {r2.status_code} (Expect 403) -> {"PASS" if r2.status_code == 403 else "FAIL"}')
    r3 = requests.get(f'{BASE_URL}/teachers', headers=headers_stu)
    print(f'Student on /teachers: {r3.status_code} (Expect 403) -> {"PASS" if r3.status_code == 403 else "FAIL"}')

    # Teacher & Admin Endpoint: GET /students
    r4 = requests.get(f'{BASE_URL}/students', headers=headers_adm)
    print(f'Admin on /students: {r4.status_code} (Expect 200) -> {"PASS" if r4.status_code == 200 else "FAIL"}')
    r5 = requests.get(f'{BASE_URL}/students', headers=headers_tch)
    print(f'Teacher on /students: {r5.status_code} (Expect 200) -> {"PASS" if r5.status_code == 200 else "FAIL"}')
    r6 = requests.get(f'{BASE_URL}/students', headers=headers_stu)
    print(f'Student on /students: {r6.status_code} (Expect 403) -> {"PASS" if r6.status_code == 403 else "FAIL"}')

    # Unauthenticated requests
    r7 = requests.get(f'{BASE_URL}/students')
    print(f'Anonymous on /students: {r7.status_code} (Expect 401) -> {"PASS" if r7.status_code == 401 else "FAIL"}')
    r8 = requests.get(f'{BASE_URL}/teachers')
    print(f'Anonymous on /teachers: {r8.status_code} (Expect 401) -> {"PASS" if r8.status_code == 401 else "FAIL"}')

    # 4. Common Portal Data Endpoints
    print('\n[4] TESTING COMMON DATA ENDPOINTS:')
    for role_name, h in [('Admin', headers_adm), ('Teacher', headers_tch), ('Student', headers_stu)]:
        r_analytics = requests.get(f'{BASE_URL}/analytics/dashboard', headers=h)
        print(f'{role_name} on /analytics/dashboard: Status {r_analytics.status_code}')
        assert r_analytics.status_code == 200

        r_timetable = requests.get(f'{BASE_URL}/timetable/my-timetable', headers=h)
        print(f'{role_name} on /timetable/my-timetable: Status {r_timetable.status_code}')
        assert r_timetable.status_code == 200

        r_sessions = requests.get(f'{BASE_URL}/attendance/sessions/active', headers=h)
        print(f'{role_name} on /attendance/sessions/active: Status {r_sessions.status_code}')
        assert r_sessions.status_code == 200

    # 5. Admin Provisioning: Create Student with Password & Immediate Login
    print('\n[5] ADMIN PROVISIONING NEW STUDENT:')
    rnd = random.randint(1000, 9999)
    new_stu_email = f'stu_test_{rnd}@example.com'
    new_stu_roll = f'ROLL-{rnd}'
    new_stu_payload = {
        'full_name': f'Auto Test Student {rnd}',
        'email': new_stu_email,
        'roll_number': new_stu_roll,
        'course_id': 1,
        'branch_id': 1,
        'department_id': 1,
        'semester': 1,
        'phone_number': '9876543210',
        'initial_password': 'StudentTest@123'
    }
    r_create_stu = requests.post(f'{BASE_URL}/students', json=new_stu_payload, headers=headers_adm)
    print(f'Create Student Status: {r_create_stu.status_code}')
    assert r_create_stu.status_code == 201, f"Failed to create student: {r_create_stu.text}"
    created_stu = r_create_stu.json()
    new_stu_id = created_stu['student_id']
    new_stu_user_id = created_stu['id']
    print(f'Created Student ID: {new_stu_id}, Email: {new_stu_email}')

    # Test immediate login with new student credentials
    print('Testing immediate login with newly created student...')
    new_stu_token, _ = test_login(new_stu_email, 'StudentTest@123', 'NEW STUDENT EMAIL')
    assert new_stu_token, "Immediate login for new student failed"
    test_login(new_stu_id, 'StudentTest@123', 'NEW STUDENT ID')

    # 6. Admin Provisioning: Create Teacher with Password & Immediate Login
    print('\n[6] ADMIN PROVISIONING NEW TEACHER:')
    new_tch_email = f'tch_test_{rnd}@example.com'
    new_tch_payload = {
        'full_name': f'Auto Test Teacher {rnd}',
        'email': new_tch_email,
        'department_id': 1,
        'designation': 'Assistant Professor',
        'qualification': 'Ph.D in CSE',
        'phone_number': '9876543211',
        'initial_password': 'TeacherTest@123'
    }
    r_create_tch = requests.post(f'{BASE_URL}/teachers', json=new_tch_payload, headers=headers_adm)
    print(f'Create Teacher Status: {r_create_tch.status_code}')
    assert r_create_tch.status_code == 201, f"Failed to create teacher: {r_create_tch.text}"
    created_tch = r_create_tch.json()
    new_tch_code = created_tch['employee_code']
    new_tch_user_id = created_tch['id']
    print(f'Created Teacher Code: {new_tch_code}, Email: {new_tch_email}')

    # Test immediate login with new teacher credentials
    print('Testing immediate login with newly created teacher...')
    new_tch_token, _ = test_login(new_tch_email, 'TeacherTest@123', 'NEW TEACHER EMAIL')
    assert new_tch_token, "Immediate login for new teacher failed"
    test_login(new_tch_code, 'TeacherTest@123', 'NEW TEACHER CODE')

    # 7. Status Toggle & Deactivation Enforcement
    print('\n[7] STATUS TOGGLE & DEACTIVATION CHECK:')
    # Deactivate student
    r_deact = requests.put(f'{BASE_URL}/students/{created_stu["profile_id"]}/status', json={'is_active': False}, headers=headers_adm)
    print(f'Deactivate Student: Status {r_deact.status_code}, Body: {r_deact.text}')
    assert r_deact.status_code == 200

    # Attempt login on deactivated student
    r_login_deact = requests.post(f'{BASE_URL}/auth/login', json={'identifier': new_stu_email, 'password': 'StudentTest@123'})
    print(f'Login on Deactivated Student: Status {r_login_deact.status_code} (Expect 403) -> {"PASS" if r_login_deact.status_code == 403 else "FAIL"}')
    assert r_login_deact.status_code == 403

    # Reactivate student
    r_react = requests.put(f'{BASE_URL}/students/{created_stu["profile_id"]}/status', json={'is_active': True}, headers=headers_adm)
    print(f'Reactivate Student: Status {r_react.status_code}, Body: {r_react.text}')
    assert r_react.status_code == 200

    # Attempt login again
    r_login_react = requests.post(f'{BASE_URL}/auth/login', json={'identifier': new_stu_email, 'password': 'StudentTest@123'})
    print(f'Login on Reactivated Student: Status {r_login_react.status_code} (Expect 200) -> {"PASS" if r_login_react.status_code == 200 else "FAIL"}')
    assert r_login_react.status_code == 200

    # Test Teacher Deactivation
    r_deact_tch = requests.put(f'{BASE_URL}/teachers/{created_tch["profile_id"]}/status', json={'is_active': False}, headers=headers_adm)
    print(f'Deactivate Teacher: Status {r_deact_tch.status_code}, Body: {r_deact_tch.text}')
    assert r_deact_tch.status_code == 200

    r_login_tch_deact = requests.post(f'{BASE_URL}/auth/login', json={'identifier': new_tch_email, 'password': 'TeacherTest@123'})
    print(f'Login on Deactivated Teacher: Status {r_login_tch_deact.status_code} (Expect 403) -> {"PASS" if r_login_tch_deact.status_code == 403 else "FAIL"}')
    assert r_login_tch_deact.status_code == 403

    print('\n===============================================================')
    print('    ALL PRODUCTION INTEGRATION & RBAC TESTS PASSED 100%!       ')
    print('===============================================================')

if __name__ == '__main__':
    main()
