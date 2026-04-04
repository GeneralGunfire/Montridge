import React, { useState, useEffect } from 'react';
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

export default function Settings() {
  const [activeSection, setActiveSection] = useState<Section>('Profile');
  const [profile, setProfile] = useState({ email: 'rajenchettyk@gmail.com', displayName: 'Rajen Chetty' });
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['tech', 'business']);
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        const response = await fetch('/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            setProfile({ email: data.email, displayName: data.displayName || '' });
            setSelectedTopics(data.topics || []);
            setExpertiseLevel(data.expertise_level || 'Standard');
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (action: () => Promise<void>) => {
    setSaveStatus('saving');
    try {
      await action();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('idle');
      alert('Failed to save changes');
    }
  };

  const handleSaveProfile = () => handleSave(async () => {
    console.log('Saving profile:', profile);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 800));
  });

  const handleSavePreferences = () => handleSave(async () => {
    const token = localStorage.getItem('jwt_token');
    await fetch('/api/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ topics: selectedTopics, expertise_level: expertiseLevel })
    });
  });

  const handleSaveNotifications = () => handleSave(async () => {
    console.log('Saving notifications:', notifications);
    await new Promise(r => setTimeout(r, 800));
  });

  const handleChangePassword = () => handleSave(async () => {
    if (passwords.new !== passwords.confirm) throw new Error('Mismatch');
    const token = localStorage.getItem('jwt_token');
    await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ password: passwords.new })
    });
    setPasswords({ new: '', confirm: '' });
  });

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
    { id: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'Preferences', icon: <SettingsIcon className="w-4 h-4" /> },
    { id: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'Account', icon: <Shield className="w-4 h-4" /> },
  ];

  const Input = ({ label, ...props }: any) => (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[11px] uppercase tracking-wider font-semibold text-[#888888]">{label}</label>
      <input 
        {...props}
        className={`bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00b4d8] focus:ring-1 focus:ring-[#00b4d8]/20 transition-all ${props.disabled ? 'opacity-40 cursor-not-allowed bg-transparent' : ''}`}
      />
    </div>
  );

  const Toggle = ({ active, onToggle, label, description }: any) => (
    <div className="flex items-center justify-between py-5 border-b border-[#1a1a1a]/50 last:border-0">
      <div className="flex flex-col gap-0.5 pr-8">
        <span className="text-sm text-white font-medium">{label}</span>
        <span className="text-xs text-[#888888] leading-relaxed">{description}</span>
      </div>
      <button 
        onClick={onToggle}
        className={`w-10 h-5 rounded-full transition-all duration-300 relative shrink-0 ${active ? 'bg-[#00b4d8]' : 'bg-[#1a1a1a]'}`}
      >
        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${active ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-6 h-6 border-2 border-[#00b4d8] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col md:flex-row selection:bg-[#00b4d8]/30">
      {/* Sidebar */}
      <nav className="w-full md:w-72 border-b md:border-b-0 md:border-r border-[#1a1a1a] bg-black flex md:flex-col sticky top-0 md:h-screen z-20">
        <div className="hidden md:flex flex-col p-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-8 h-8 bg-[#00b4d8] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,180,216,0.3)]">
              <span className="text-black font-bold text-sm">M</span>
            </div>
            <span className="text-xl font-semibold tracking-tight">Montridge</span>
          </div>
          
          <div className="flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#888888] font-bold mb-4 ml-4">Settings</p>
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-3 px-4 py-3 transition-all text-sm rounded-lg group ${
                  activeSection === item.id 
                    ? 'text-[#00b4d8] bg-[#0a0a0a] shadow-[inset_0_0_10px_rgba(0,180,216,0.05)]' 
                    : 'text-[#888888] hover:text-white hover:bg-[#0a0a0a]/50'
                }`}
              >
                <span className={`transition-colors ${activeSection === item.id ? 'text-[#00b4d8]' : 'text-[#888888] group-hover:text-white'}`}>
                  {item.icon}
                </span>
                {item.id}
              </button>
            ))}
          </div>

          <div className="mt-auto pt-8 border-t border-[#1a1a1a]">
            <button className="flex items-center gap-3 px-4 py-3 text-sm text-[#888888] hover:text-red-400 transition-colors w-full text-left">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
        
        {/* Mobile Nav */}
        <div className="md:hidden flex w-full overflow-x-auto no-scrollbar px-4">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-2 px-5 py-5 transition-all text-xs font-medium whitespace-nowrap border-b-2 ${
                activeSection === item.id 
                  ? 'text-[#00b4d8] border-[#00b4d8] bg-[#0a0a0a]/50' 
                  : 'text-[#888888] border-transparent'
              }`}
            >
              {item.icon}
              {item.id}
            </button>
          ))}
        </div>
      </nav>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 md:p-16 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <header className="mb-12">
                <h1 className="text-4xl font-semibold tracking-tight mb-2">{activeSection}</h1>
                <p className="text-[#888888] text-sm">Manage your account settings and preferences.</p>
              </header>

              {activeSection === 'Profile' && (
                <div className="space-y-12">
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="relative group">
                      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center text-4xl font-medium text-[#00b4d8] shadow-2xl transition-transform duration-500 group-hover:scale-105">
                        {profile.displayName ? profile.displayName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#00b4d8] rounded-full border-4 border-black flex items-center justify-center shadow-lg">
                        <Shield className="w-3.5 h-3.5 text-black" />
                      </div>
                    </div>
                    <div className="text-center md:text-left flex-1">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#00b4d8]/10 border border-[#00b4d8]/20 text-[#00b4d8] text-[10px] font-bold uppercase tracking-widest mb-4">
                        Verified Identity
                      </div>
                      <h3 className="text-2xl font-semibold mb-2">Personal Avatar</h3>
                      <p className="text-sm text-[#888888] max-w-sm leading-relaxed">Your initials are used to generate a unique identifier for your profile. Photo upload is coming soon.</p>
                    </div>
                  </div>

                  <div className="grid gap-8 max-w-2xl">
                    <Input 
                      label="Account Email" 
                      value={profile.email} 
                      disabled 
                    />
                    
                    <Input 
                      label="Display Name" 
                      value={profile.displayName} 
                      onChange={(e: any) => setProfile({ ...profile, displayName: e.target.value })}
                      placeholder="Enter your name"
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-6">
                    <button 
                      onClick={handleSaveProfile}
                      disabled={saveStatus === 'saving'}
                      className="bg-[#00b4d8] text-black font-bold text-sm px-10 py-4 rounded-lg hover:bg-[#00b4d8]/90 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3 shadow-[0_0_20px_rgba(0,180,216,0.2)]"
                    >
                      {saveStatus === 'saving' ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
                      ) : saveStatus === 'success' ? 'Changes Saved' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {activeSection === 'Preferences' && (
                <div className="space-y-16">
                  <section>
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">Topics I follow</h3>
                        <p className="text-sm text-[#888888]">Select topics to personalize your intelligence feed.</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#1a1a1a] text-[10px] text-[#888888] uppercase tracking-widest font-bold border border-[#1a1a1a]">{selectedTopics.length} Selected</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {TOPICS.map(topic => {
                        const isSelected = selectedTopics.includes(topic.id);
                        return (
                          <button
                            key={topic.id}
                            onClick={() => toggleTopic(topic.id)}
                            className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 group relative ${
                              isSelected 
                                ? 'border-[#00b4d8] bg-[#00b4d8]/5 text-[#00b4d8] shadow-[0_0_20px_rgba(0,180,216,0.05)]' 
                                : 'border-[#1a1a1a] bg-[#0a0a0a] text-[#888888] hover:border-[#1a1a1a]/80'
                            }`}
                          >
                            <div className={`mb-4 transition-transform duration-500 group-hover:scale-110 ${isSelected ? 'text-[#00b4d8]' : 'text-[#888888]'}`}>
                              {topic.icon}
                            </div>
                            <span className="text-xs font-semibold text-center leading-tight">{topic.name}</span>
                            {isSelected && (
                              <motion.div 
                                layoutId="active-topic"
                                className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#00b4d8] rounded-full shadow-[0_0_8px_rgba(0,180,216,0.8)]"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section>
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold mb-1">Intelligence Depth</h3>
                      <p className="text-sm text-[#888888]">Choose the level of detail for your news analysis.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {EXPERTISE_OPTIONS.map(option => {
                        const isSelected = expertiseLevel === option.id;
                        return (
                          <button
                            key={option.id}
                            onClick={() => setExpertiseLevel(option.id as ExpertiseLevel)}
                            className={`flex items-center gap-6 p-6 rounded-2xl border transition-all duration-300 text-left group relative ${
                              isSelected 
                                ? 'border-[#00b4d8] bg-[#0a0a0a] shadow-[inset_0_0_30px_rgba(0,180,216,0.05)]' 
                                : 'border-[#1a1a1a] bg-[#0a0a0a] hover:bg-[#0a0a0a]/80'
                            }`}
                          >
                            <div className={`p-4 rounded-xl transition-all duration-500 ${isSelected ? 'bg-[#00b4d8]/10 text-[#00b4d8] scale-110' : 'bg-[#1a1a1a] text-[#888888]'}`}>
                              {option.icon}
                            </div>
                            <div className="flex-1">
                              <h4 className={`text-base font-semibold mb-1 ${isSelected ? 'text-white' : 'text-[#888888]'}`}>
                                {option.title}
                              </h4>
                              <p className="text-sm text-[#888888] leading-relaxed max-w-md">{option.description}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 transition-all duration-500 flex items-center justify-center ${isSelected ? 'border-[#00b4d8] bg-[#00b4d8]' : 'border-[#1a1a1a]'}`}>
                              {isSelected && <div className="w-2 h-2 bg-black rounded-full" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="max-w-sm">
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold mb-1">Language Settings</h3>
                      <p className="text-sm text-[#888888]">Preferred language for your intelligence feed.</p>
                    </div>
                    <div className="relative group">
                      <select className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#00b4d8] appearance-none cursor-pointer transition-all group-hover:border-[#1a1a1a]/80">
                        <option>English (United Kingdom)</option>
                        <option>English (United States)</option>
                      </select>
                      <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888] rotate-90 pointer-events-none transition-transform group-hover:text-white" />
                    </div>
                  </section>

                  <div className="pt-6">
                    <button 
                      onClick={handleSavePreferences}
                      className="bg-[#00b4d8] text-black font-bold text-sm px-10 py-4 rounded-lg hover:bg-[#00b4d8]/90 transition-all active:scale-95 shadow-[0_0_20px_rgba(0,180,216,0.2)]"
                    >
                      {saveStatus === 'success' ? 'Preferences Saved' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              )}

              {activeSection === 'Notifications' && (
                <div className="space-y-10">
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-8 py-2">
                      <Toggle 
                        label="Breaking news alerts" 
                        description="Push notifications for critical intelligence signals with a score of 90+"
                        active={notifications.breakingNews}
                        onToggle={() => setNotifications({ ...notifications, breakingNews: !notifications.breakingNews })}
                      />
                      <Toggle 
                        label="Daily Debrief reminder" 
                        description="A daily personalized summary of the most important news for your topics"
                        active={notifications.dailyDebrief}
                        onToggle={() => setNotifications({ ...notifications, dailyDebrief: !notifications.dailyDebrief })}
                      />
                      <Toggle 
                        label="Weekly digest email" 
                        description="A comprehensive look at the week's intelligence trends and entity relationships"
                        active={notifications.weeklyDigest}
                        onToggle={() => setNotifications({ ...notifications, weeklyDigest: !notifications.weeklyDigest })}
                      />
                    </div>
                  </div>

                  <div className="pt-6">
                    <button 
                      onClick={handleSaveNotifications}
                      className="bg-[#00b4d8] text-black font-bold text-sm px-10 py-4 rounded-lg hover:bg-[#00b4d8]/90 transition-all active:scale-95 shadow-[0_0_20px_rgba(0,180,216,0.2)]"
                    >
                      Save Notification Settings
                    </button>
                  </div>
                </div>
              )}

              {activeSection === 'Account' && (
                <div className="space-y-16">
                  <section className="space-y-10">
                    <div className="flex flex-col gap-8 max-w-md">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">Security</h3>
                        <p className="text-sm text-[#888888]">Update your password to keep your account secure.</p>
                      </div>
                      <div className="space-y-6">
                        <Input 
                          label="New Password" 
                          type="password"
                          value={passwords.new}
                          onChange={(e: any) => setPasswords({ ...passwords, new: e.target.value })}
                          placeholder="••••••••"
                        />
                        <Input 
                          label="Confirm New Password" 
                          type="password"
                          value={passwords.confirm}
                          onChange={(e: any) => setPasswords({ ...passwords, confirm: e.target.value })}
                          placeholder="••••••••"
                        />
                      </div>
                      <button 
                        onClick={handleChangePassword}
                        className="bg-[#00b4d8] text-black font-bold text-sm px-10 py-4 rounded-lg hover:bg-[#00b4d8]/90 transition-all active:scale-95 shadow-[0_0_20px_rgba(0,180,216,0.2)]"
                      >
                        Update Security Credentials
                      </button>
                    </div>
                  </section>

                  <section className="pt-16 border-t border-[#1a1a1a]">
                    <div className="bg-red-950/5 border border-red-900/20 rounded-2xl p-10">
                      <div className="flex items-start gap-6 mb-8">
                        <div className="p-4 bg-red-900/10 rounded-2xl text-red-500 shadow-inner">
                          <AlertTriangle className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-semibold text-red-500 mb-2">Danger Zone</h3>
                          <p className="text-[#888888] text-sm leading-relaxed max-w-lg">
                            Permanently delete your account and all associated intelligence data. This action is irreversible and will remove access to all your saved insights.
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowDeleteModal(true)}
                        className="bg-transparent border border-red-900/40 text-red-500 px-10 py-3.5 rounded-lg hover:bg-red-500 hover:text-white transition-all font-bold text-[10px] uppercase tracking-[0.2em]"
                      >
                        Delete Account
                      </button>
                    </div>
                  </section>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-[#0a0a0a] border border-[#1a1a1a] rounded-[32px] p-12 max-w-md w-full shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50" />
              
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="absolute top-8 right-8 text-[#888888] hover:text-white transition-colors p-2 hover:bg-[#1a1a1a] rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-20 h-20 bg-red-900/10 rounded-3xl flex items-center justify-center text-red-500 mb-10 mx-auto shadow-inner">
                <AlertTriangle className="w-10 h-10" />
              </div>

              <h2 className="text-3xl font-bold mb-4 text-center tracking-tight">Final Warning</h2>
              <p className="text-[#888888] text-sm text-center mb-10 leading-relaxed">
                This will permanently remove your profile and intelligence history. Type <span className="text-white font-bold px-1.5 py-0.5 bg-[#1a1a1a] rounded mx-1">DELETE</span> below to confirm.
              </p>
              
              <div className="flex flex-col gap-8">
                <div className="relative">
                  <input 
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full bg-black border border-[#1a1a1a] rounded-2xl px-6 py-5 text-center text-white focus:outline-none focus:border-red-500 transition-all font-mono tracking-[0.3em] text-lg uppercase placeholder:text-[#1a1a1a]"
                    placeholder="CONFIRM"
                  />
                </div>
                <button 
                  disabled={deleteConfirmText !== 'DELETE'}
                  onClick={handleDeleteAccount}
                  className={`w-full py-5 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] transition-all duration-500 ${
                    deleteConfirmText === 'DELETE' 
                      ? 'bg-red-500 text-white hover:bg-red-600 shadow-[0_0_40px_rgba(239,68,68,0.4)] scale-105' 
                      : 'bg-[#1a1a1a] text-[#888888] cursor-not-allowed'
                  }`}
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
