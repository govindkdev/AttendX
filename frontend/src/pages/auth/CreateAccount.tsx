import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { StudentActivation } from './StudentActivation';
import { TeacherActivation } from './TeacherActivation';

export const CreateAccount: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialRole = searchParams.get('role');

  const [role, setRole] = useState<'student' | 'teacher'>(
    initialRole === 'teacher' ? 'teacher' : 'student'
  );

  return (
    <div>
      {role === 'student' ? <StudentActivation /> : <TeacherActivation />}
    </div>
  );
};
