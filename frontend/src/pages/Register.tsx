import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import api from '../api'; // Import the default export from api.ts

const Register = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Don't hash password on client side, let the server handle it
      const response = await api.post('/auth/register', {
        username,
        password,
        email,
        role,
        name: username // Use username as name if not provided
      });

      if (response.status === 201) {
        alert('Registration successful!');
        navigate('/login');
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-blue-600 py-4">
          <h2 className="text-center text-2xl font-bold text-white">Register</h2>
        </div>
        <div className="p-6">
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          <form onSubmit={handleRegister} className="space-y-4">
            <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required fullWidth />
            <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
            <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
            <select className="w-full border p-2 rounded" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="MENTOR">MENTOR</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <Button type="submit" variant="primary" fullWidth>Register</Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
