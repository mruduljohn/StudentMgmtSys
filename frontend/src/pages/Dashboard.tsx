import React from 'react';
import { Users, UserCog, FileSpreadsheet, BookOpen } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useStudentStore } from '../store/studentStore';
import { useMentorStore } from '../store/mentorStore';
import { useAuthStore } from '../store/authStore';

const DashboardCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex items-center">
      <div className={`p-3 rounded-full ${color} text-white mr-4`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { students } = useStudentStore();
  const { mentors } = useMentorStore();
  const { user } = useAuthStore();
  
  const isAdmin = user?.role === 'admin';
  
  // For mentors, filter students to only show those in their class
  const filteredStudents = isAdmin 
    ? students 
    : students.filter(student => student.batch === user?.class);
  
  // Count students by status
  const joinedStudents = filteredStudents.filter(s => s.joined === 'JOINED').length;
  const allotedStudents = filteredStudents.filter(s => s.joined === 'ALLOTED').length;
  
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {user?.name}!
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Total Students"
          value={filteredStudents.length}
          icon={<Users size={24} />}
          color="bg-blue-500"
        />
        
        <DashboardCard
          title="Joined Students"
          value={joinedStudents}
          icon={<BookOpen size={24} />}
          color="bg-green-500"
        />
        
        <DashboardCard
          title="Alloted Students"
          value={allotedStudents}
          icon={<FileSpreadsheet size={24} />}
          color="bg-yellow-500"
        />
        
        {isAdmin && (
          <DashboardCard
            title="Total Mentors"
            value={mentors.length}
            icon={<UserCog size={24} />}
            color="bg-purple-500"
          />
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-700">Students by Stream</h3>
            <ul className="mt-2 space-y-1">
              <li className="flex justify-between">
                <span>Medical</span>
                <span className="font-medium">
                  {filteredStudents.filter(s => s.stream === 'MEDICAL').length}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Engineering</span>
                <span className="font-medium">
                  {filteredStudents.filter(s => s.stream === 'ENGINEERING').length}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Foundation</span>
                <span className="font-medium">
                  {filteredStudents.filter(s => s.stream === 'FOUNDATION').length}
                </span>
              </li>
            </ul>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-700">Students by Syllabus</h3>
            <ul className="mt-2 space-y-1">
              <li className="flex justify-between">
                <span>State</span>
                <span className="font-medium">
                  {filteredStudents.filter(s => s.syllabus === 'STATE').length}
                </span>
              </li>
              <li className="flex justify-between">
                <span>CBSE</span>
                <span className="font-medium">
                  {filteredStudents.filter(s => s.syllabus === 'CBSE').length}
                </span>
              </li>
              <li className="flex justify-between">
                <span>ICSC</span>
                <span className="font-medium">
                  {filteredStudents.filter(s => s.syllabus === 'ICSC').length}
                </span>
              </li>
            </ul>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-700">Students by Gender</h3>
            <ul className="mt-2 space-y-1">
              <li className="flex justify-between">
                <span>Male</span>
                <span className="font-medium">
                  {filteredStudents.filter(s => s.gender === 'MALE').length}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Female</span>
                <span className="font-medium">
                  {filteredStudents.filter(s => s.gender === 'FEMALE').length}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Different</span>
                <span className="font-medium">
                  {filteredStudents.filter(s => s.gender === 'DIFFERENT').length}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;