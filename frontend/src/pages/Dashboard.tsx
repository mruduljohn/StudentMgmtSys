import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Users, UserCog, FileSpreadsheet, BookOpen, School, Home, BookX, ShoppingBag, CreditCard, Tablet, AlertTriangle } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useStudentStore } from '../store/studentStore';
import { useMentorStore } from '../store/mentorStore';
import { useAuthStore } from '../store/authStore';
import { Student } from '../types';
import { Link } from 'react-router-dom';
import PDFSection from '../components/dashboard/PDFSection';
import PDFConfigModal from '../components/dashboard/PDFConfigModal';

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

const Dashboard: React.FC = observer(() => {
  const studentStore = useStudentStore();
  const { mentors } = useMentorStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isPDFConfigOpen, setIsPDFConfigOpen] = useState(false);
  
  // Initialize stores
  useEffect(() => {
    const initializeData = async () => {
      try {
        await studentStore.init();
        setAllStudents(studentStore.getAllStudents);
        setLoading(false);
      } catch (error) {
        console.error("Failed to initialize stores:", error);
        setLoading(false);
      }
    };
    
    initializeData();
  }, [studentStore, user]);
  
  const isAdmin = user?.role === 'ADMIN';
  
  // Get only JOINED students for accurate counting
  const joinedStudentsOnly = allStudents.filter(s => s.joined === 'JOINED');
  
  // Count students by status
  const joinedStudents = joinedStudentsOnly.length;
  const allotedStudents = allStudents.filter(s => s.joined === 'ALLOTED').length;
  const discontinuedStudents = allStudents.filter(s => s.joined === 'DISCONTINUED').length;
  const notJoiningStudents = allStudents.filter(s => s.joined === 'NOT JOINING').length;
  const centrechangedStudents = allStudents.filter(s => s.joined === 'CENTRE CHANGE').length;
  
  // Count students with dues - only consider JOINED students for dues
  const studyMaterialDue = joinedStudentsOnly.filter(s => 
    s.studyMaterial === 'NOT RECEIVED' || s.studyMaterial === 'PARTIALLY RECEIVED'
  ).length;
  
  const uniformDue = joinedStudentsOnly.filter(s => 
    s.uniform === 'NOT RECEIVED' || s.uniform === 'PARTIALLY RECEIVED'
  ).length;
  
  const idCardDue = joinedStudentsOnly.filter(s => 
    s.idCard === 'NOT RECEIVED'
  ).length;
  
  const tabDue = joinedStudentsOnly.filter(s => 
    s.tab === 'REQUESTED NOT PAID' || s.tab === 'REQUESTED PAID'
  ).length;
  
  const feeDue = joinedStudentsOnly.filter(s => s.feeDue > 0).length;
  
  // Count students by hostel type - only consider JOINED students
  const dayScholars = joinedStudentsOnly.filter(s => s.hostel === 'DAY SCHOLAR' || s.hostel === 'DS').length;
  const hostelers = joinedStudentsOnly.length - dayScholars;
  
  // For mentors, also count students in their class
  const mentorClassStudents = !isAdmin && user?.name 
    ? allStudents.filter(student => {
        // Convert the class teacher name to match the user's username format for comparison
        const classTeacherAsUsername = student.classTeacher
          .toUpperCase()
          .replace(/\s+/g, '.');
        
        return classTeacherAsUsername === user.username;
      })
    : [];
  
  if (loading || studentStore.isLoading) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <div className="text-lg">Loading dashboard data...</div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {user?.name}!
        </p>
      </div>
      
      {/* PDF Section */}
      <PDFSection onConfigClick={() => setIsPDFConfigOpen(true)} />
      
      {/* Main statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Total Students"
          value={allStudents.length}
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
        
        <DashboardCard
          title="My Students"
          value={isAdmin ? joinedStudents : mentorClassStudents.length}
          icon={<UserCog size={24} />}
          color="bg-purple-500"
        />
      </div>
      
      {/* Additional statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Day Scholars"
          value={dayScholars}
          icon={<School size={24} />}
          color="bg-indigo-500"
        />
        
        <DashboardCard
          title="Hostelers"
          value={hostelers}
          icon={<Home size={24} />}
          color="bg-pink-500"
        />
        
        <DashboardCard
          title="Discontinued"
          value={discontinuedStudents}
          icon={<FileSpreadsheet size={24} />}
          color="bg-amber-500"
        />
        <DashboardCard
          title="Not Joining"
          value={notJoiningStudents}
          icon={<FileSpreadsheet size={24} />}
          color="bg-amber-500"
        />
        <DashboardCard
          title="Centre Changed"
          value={centrechangedStudents}
          icon={<BookX size={24} />}
          color="bg-red-500"
        />
      </div>
      
      {/* Due items statistics */}
      <h2 className="text-xl font-semibold mb-4">Due Items</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <DashboardCard
          title="Study Material Due"
          value={studyMaterialDue}
          icon={<BookOpen size={24} />}
          color="bg-orange-500"
        />
        
        <DashboardCard
          title="Uniform Due"
          value={uniformDue}
          icon={<ShoppingBag size={24} />}
          color="bg-emerald-500"
        />
        
        <DashboardCard
          title="ID Card Due"
          value={idCardDue}
          icon={<CreditCard size={24} />}
          color="bg-cyan-500"
        />
        
        <DashboardCard
          title="Tab Due"
          value={tabDue}
          icon={<Tablet size={24} />}
          color="bg-violet-500"
        />
        
        <DashboardCard
          title="Fee Due"
          value={feeDue}
          icon={<AlertTriangle size={24} />}
          color="bg-rose-500"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Student Statistics</h2>
          {studentStore.getStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">Average NEET Score</p>
                  <p className="text-xl font-bold">{studentStore.getStats.averageNeetScore || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Average +2 Percentage</p>
                  <p className="text-xl font-bold">{studentStore.getStats.averagePlus2Percentage || 'N/A'}%</p>
                </div>
              </div>
              
              <div>
                <p className="text-gray-500 text-sm">Fee Due Count</p>
                <p className="text-xl font-bold">{studentStore.getStats.feeDueCount || 0} students</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No statistics available</p>
          )}
        </div>
        
        {!isAdmin && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">My Class Students</h2>
            {mentorClassStudents.length > 0 ? (
              <div>
                <p className="text-gray-600 mb-2">You are assigned as the class teacher for {mentorClassStudents.length} students.</p>
                <p className="text-gray-600">You can edit all details except Student ID for these students.</p>
              </div>
            ) : (
              <p className="text-gray-500">You are not assigned as a class teacher for any students yet.</p>
            )}
          </div>
        )}
        
        {isAdmin && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/analytics" className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg flex items-center">
                <div className="p-2 rounded-full bg-blue-500 text-white mr-3">
                  <FileSpreadsheet size={20} />
                </div>
                <span className="font-medium">Analytics</span>
              </Link>
              
              <Link to="/audit-logs" className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg flex items-center">
                <div className="p-2 rounded-full bg-purple-500 text-white mr-3">
                  <FileSpreadsheet size={20} />
                </div>
                <span className="font-medium">Audit Logs</span>
              </Link>
              
              <Link to="/settings" className="bg-green-50 hover:bg-green-100 p-4 rounded-lg flex items-center">
                <div className="p-2 rounded-full bg-green-500 text-white mr-3">
                  <FileSpreadsheet size={20} />
                </div>
                <span className="font-medium">Settings</span>
              </Link>
              
              <Link to="/import-export" className="bg-amber-50 hover:bg-amber-100 p-4 rounded-lg flex items-center">
                <div className="p-2 rounded-full bg-amber-500 text-white mr-3">
                  <FileSpreadsheet size={20} />
                </div>
                <span className="font-medium">Import/Export</span>
              </Link>
            </div>
          </div>
        )}
      </div>
      
      {/* PDF Config Modal */}
      <PDFConfigModal 
        isOpen={isPDFConfigOpen}
        onClose={() => setIsPDFConfigOpen(false)}
      />
    </Layout>
  );
});

export default Dashboard;