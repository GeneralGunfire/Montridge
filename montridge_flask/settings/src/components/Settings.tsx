import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Settings as SettingsIcon,
  Bell,
  Shield,
  Globe,
  TrendingUp,
  Cpu,
  Activity,
  ShieldAlert,
  Leaf,
  Users,
  DollarSign,
  Circle,
  BarChart3,
  Network,
  ChevronRight,
  ChevronLeft,
  LogOut,
  AlertTriangle,
  X
} from 'lucide-react';

type Section = 'Profile' | 'Preferences' | 'Notifications' | 'Account';

type Topic = {
  id: string;
  name: string;
  icon: React.ReactNode;
};

const TOPICS: Topic[] = [
  { id: 'politics', name: 'Politics & World Affairs', icon: <Globe className="w-5 h-5" /> },
  { id: 'business', name: 'Business & Markets', icon: <TrendingUp className="w-5 h-5" /> },
  { id: 'tech', name: 'Technology', icon: <Cpu className="w-5 h-5" /> },
  { id: 'science', name: 'Science & Health', icon: <Activity className="w-5 h-5" /> },
  { id: 'security', name: 'Conflicts & Security', icon: <ShieldAlert className="w-5 h-5" /> },
  { id: 'environment', name: 'Environment & Climate', icon: <Leaf className="w-5 h-5" /> },
  { id: 'culture', name: 'Culture & Society', icon: <Users className="w-5 h-5" /> },
  { id: 'finance', name: 'Finance & Economics', icon: <DollarSign className="w-5 h-5" /> },
];

type ExpertiseLevel = 'Essential' | 'Standard' | 'Expert';

const EXPERTISE_OPTIONS = [
  { id: 'Essential', title: 'Essential', description: 'Key facts and headlines.', icon: <Circle className="w-5 h-5" /> },
  { id: 'Standard', title: 'Standard', description: 'Full context and analysis.', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'Expert', title: 'Expert', description: 'Deep analysis and sources.', icon: <Network className="w-5 h-5" /> },
];

// M lettermark SVG (static, nav bar size)
const MLogoMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M 15 65 V 15 L 40 40 L 65 15 V 65" fill="white" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Settings() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<Section>('Profile');
  const [profile, setProfile] = useState({ email: 'user@example.com', displayName: '' });
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [expertiseLevel, setExpertiseLevel] = useState<ExpertiseLevel>('Standard');
  const [notifications, setNotifications] = useState({
    breakingNews: true,
    dailyDebrief: true,
    weeklyDigest: false,
  });
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        const response = await fetch('/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setProfile({ email: data.email, displayName: data.displayName || '' });
          setSelectedTopics(data.topics || []);
          setExpertiseLevel(data.expertise_level || 'Standard');
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    // API call for profile update
    console.log('Saving profile:', profile);
  };

  const handleSavePreferences = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      await fetch('/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ topics: selectedTopics, expertise_level: expertiseLevel })
      });
      alert('Preferences saved');
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const handleSaveNotifications = async () => {
    console.log('Saving notifications:', notifications);
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      alert('Passwords do not match');
      return;
    }
    try {
      const token = localStorage.getItem('jwt_token');
      await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: passwords.new })
      });
      alert('Password changed');
      setPasswords({ new: '', confirm: '' });
    } catch (error) {
      console.error('Failed to change password:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    try {
      const token = localStorage.getItem('jwt_token');
      await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  const toggleTopic = (id: string) => {
    setSelectedTopics(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const navItems: { id: Section; icon: React.ReactNode }[] = [
    { id: 'Profile', icon: <User className="w-5 h-5" /> },
    { id: 'Preferences', icon: <SettingsIcon className="w-5 h-5" /> },
    { id: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'Account', icon: <Shield className="w-5 h-5" /> },
  ];

  const Input = ({ label, ...props }: any) => (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm text-[#888888]">{label}</label>
      <input 
        {...props}
        className={`bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00b4d8] transition-colors ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    </div>
  );

  const Toggle = ({ active, onToggle, label, description }: any) => (
    <div className="flex items-center justify-between py-4 border-b border-[#1a1a1a] last:border-0">
      <div className="flex flex-col gap-1">
        <span className="text-white font-medium">{label}</span>
        <span className="text-sm text-[#888888]">{description}</span>
      </div>
      <button 
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition-colors relative ${active ? 'bg-[#00b4d8]' : 'bg-[#1a1a1a]'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${active ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  );

  const handleBack = () => {
    if (pageRef.current) {
      pageRef.current.style.transition = 'opacity 120ms ease';
      pageRef.current.style.opacity = '0';
    }
    setTimeout(() => { window.location.href = '/dashboard'; }, 120);
  };

  return (
    <div ref={pageRef} className="min-h-screen bg-[#05050A] text-white font-sans flex flex-col md:flex-row relative">
      {/* Radial glow — matches landing page */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(0, 180, 216, 0.06) 0%, transparent 60%)' }}
      />

      {/* Sidebar / Mobile Tabs */}
      <nav className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#1a1a1a] bg-[#05050A] flex md:flex-col overflow-x-auto md:overflow-x-visible sticky top-0 md:h-screen z-10">
        {/* Logo */}
        <div className="hidden md:flex p-8 pb-4 items-center">
          <div className="w-8 h-8 mr-3 flex-shrink-0">
            <MLogoMark className="w-full h-full" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Montridge</span>
        </div>

        {/* Back button — desktop only, inside sidebar */}
        <button
          onClick={handleBack}
          className="hidden md:flex items-center gap-2 px-8 pb-5 cursor-pointer group w-full text-left"
          style={{ color: '#666666' }}
        >
          <ChevronLeft className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-[3px] flex-shrink-0" />
          <span className="text-sm font-medium tracking-[0.05em] transition-colors duration-150 group-hover:text-white">Back to Dashboard</span>
        </button>
        
        <div className="flex md:flex-col w-full">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-3 px-6 py-4 md:py-3 transition-all text-sm font-medium whitespace-nowrap md:whitespace-normal ${
                activeSection === item.id 
                  ? 'text-[#00b4d8] bg-[#0a0a0a] md:border-l-2 border-[#00b4d8] md:border-b-0 border-b-2' 
                  : 'text-[#888888] hover:text-white hover:bg-[#0a0a0a]/50'
              }`}
            >
              {item.icon}
              {item.id}
            </button>
          ))}
          <a
            href="/map"
            className="flex items-center gap-3 px-6 py-4 md:py-3 transition-all text-sm font-medium whitespace-nowrap md:whitespace-normal text-[#888888] hover:text-white hover:bg-[#0a0a0a]/50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            Map
          </a>
        </div>
      </nav>

      {/* Content Area */}
      <main className="flex-1 p-6 md:p-12 max-w-4xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <h1 className="text-3xl font-semibold mb-8">{activeSection}</h1>

            {activeSection === 'Profile' && (
              <div className="flex flex-col gap-8 max-w-md">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-[#1a1a1a] border border-[#1a1a1a] flex items-center justify-center text-2xl font-medium text-[#00b4d8]">
                    {profile.displayName ? profile.displayName.substring(0, 2).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Profile Picture</h3>
                    <p className="text-sm text-[#888888]">Initials are used as your avatar.</p>
                  </div>
                </div>

                <Input 
                  label="Email Address" 
                  value={profile.email} 
                  disabled 
                />
                
                <Input 
                  label="Display Name" 
                  value={profile.displayName} 
                  onChange={(e: any) => setProfile({ ...profile, displayName: e.target.value })}
                  placeholder="Enter your name"
                />

                <button 
                  onClick={handleSaveProfile}
                  className="bg-[#00b4d8] text-black font-semibold py-3 rounded-lg hover:bg-[#00b4d8]/90 transition-all active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            )}

            {activeSection === 'Preferences' && (
              <div className="flex flex-col gap-10">
                <section>
                  <h3 className="text-lg font-medium mb-4">Topics I follow</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {TOPICS.map(topic => {
                      const isSelected = selectedTopics.includes(topic.id);
                      return (
                        <button
                          key={topic.id}
                          onClick={() => toggleTopic(topic.id)}
                          className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 ${
                            isSelected 
                              ? 'border-[#00b4d8] bg-[#00b4d8]/5 text-[#00b4d8]' 
                              : 'border-[#1a1a1a] bg-[#0a0a0a] text-[#888888] hover:border-[#1a1a1a]/80'
                          }`}
                        >
                          <div className="mb-2">{topic.icon}</div>
                          <span className="text-xs font-medium text-center">{topic.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-medium mb-4">Reading level</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {EXPERTISE_OPTIONS.map(option => {
                      const isSelected = expertiseLevel === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => setExpertiseLevel(option.id as ExpertiseLevel)}
                          className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left ${
                            isSelected 
                              ? 'border-[#00b4d8] bg-[#0a0a0a] shadow-[inset_0_0_20px_rgba(0,180,216,0.05)]' 
                              : 'border-[#1a1a1a] bg-[#0a0a0a] hover:bg-[#0a0a0a]/80'
                          }`}
                        >
                          <div className={isSelected ? 'text-[#00b4d8]' : 'text-[#888888]'}>
                            {option.icon}
                          </div>
                          <div>
                            <h4 className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-[#888888]'}`}>
                              {option.title}
                            </h4>
                            <p className="text-xs text-[#888888]">{option.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="max-w-md">
                  <h3 className="text-lg font-medium mb-4">Feed language</h3>
                  <select className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00b4d8] appearance-none">
                    <option>English</option>
                  </select>
                </section>

                <button 
                  onClick={handleSavePreferences}
                  className="max-w-md bg-[#00b4d8] text-black font-semibold py-3 rounded-lg hover:bg-[#00b4d8]/90 transition-all active:scale-95"
                >
                  Save Preferences
                </button>
              </div>
            )}

            {activeSection === 'Notifications' && (
              <div className="flex flex-col gap-8 max-w-2xl">
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6">
                  <Toggle 
                    label="Breaking news alerts" 
                    description="Get notified for intelligence signals with a score of 90+"
                    active={notifications.breakingNews}
                    onToggle={() => setNotifications({ ...notifications, breakingNews: !notifications.breakingNews })}
                  />
                  <Toggle 
                    label="Daily Debrief reminder" 
                    description="A daily summary of the most important news for your topics"
                    active={notifications.dailyDebrief}
                    onToggle={() => setNotifications({ ...notifications, dailyDebrief: !notifications.dailyDebrief })}
                  />
                  <Toggle 
                    label="Weekly digest email" 
                    description="A comprehensive look at the week's intelligence trends"
                    active={notifications.weeklyDigest}
                    onToggle={() => setNotifications({ ...notifications, weeklyDigest: !notifications.weeklyDigest })}
                  />
                </div>

                <button 
                  onClick={handleSaveNotifications}
                  className="max-w-md bg-[#00b4d8] text-black font-semibold py-3 rounded-lg hover:bg-[#00b4d8]/90 transition-all active:scale-95"
                >
                  Save Notification Settings
                </button>
              </div>
            )}

            {activeSection === 'Account' && (
              <div className="flex flex-col gap-12">
                <section className="flex flex-col gap-6 max-w-md">
                  <h3 className="text-lg font-medium">Change Password</h3>
                  <Input 
                    label="New Password" 
                    type="password"
                    value={passwords.new}
                    onChange={(e: any) => setPasswords({ ...passwords, new: e.target.value })}
                  />
                  <Input 
                    label="Confirm Password" 
                    type="password"
                    value={passwords.confirm}
                    onChange={(e: any) => setPasswords({ ...passwords, confirm: e.target.value })}
                  />
                  <button 
                    onClick={handleChangePassword}
                    className="bg-[#00b4d8] text-black font-semibold py-3 rounded-lg hover:bg-[#00b4d8]/90 transition-all active:scale-95"
                  >
                    Update Password
                  </button>
                </section>

                <section className="border border-red-900/30 bg-red-900/5 rounded-xl p-8 max-w-2xl">
                  <div className="flex items-center gap-3 mb-4 text-red-500">
                    <AlertTriangle className="w-6 h-6" />
                    <h3 className="text-lg font-medium">Danger Zone</h3>
                  </div>
                  <p className="text-[#888888] text-sm mb-6">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button 
                    onClick={() => setShowDeleteModal(true)}
                    className="border border-red-500 text-red-500 px-6 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-all font-medium"
                  >
                    Delete Account
                  </button>
                </section>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="absolute top-4 right-4 text-[#888888] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-2xl font-semibold mb-4">Are you absolutely sure?</h2>
              <p className="text-[#888888] mb-6">
                This action cannot be undone. This will permanently delete your account and remove your data from our servers.
              </p>
              
              <div className="flex flex-col gap-4">
                <p className="text-sm text-[#888888]">
                  Please type <span className="text-white font-bold">DELETE</span> to confirm.
                </p>
                <input 
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="bg-black border border-[#1a1a1a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Type DELETE"
                />
                <button 
                  disabled={deleteConfirmText !== 'DELETE'}
                  onClick={handleDeleteAccount}
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    deleteConfirmText === 'DELETE' 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-[#1a1a1a] text-[#888888] cursor-not-allowed'
                  }`}
                >
                  Confirm Deletion
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
