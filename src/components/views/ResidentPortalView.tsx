import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Car, 
  Utensils, 
  Package, 
  User, 
  QrCode, 
  X, 
  Star, 
  ChevronDown, 
  ChevronUp, 
  Bell, 
  BellRing, 
  MessageSquare, 
  AlertTriangle 
} from 'lucide-react';
import { toast } from 'sonner';
import { Session } from '@supabase/supabase-js';
import { VisitorPermit, FavoriteVisitor, ResidentTab } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { QRCodeModal } from '../modals/QRCodeModal';
import { formatTime } from '../../utils/dateUtils';

interface ResidentPortalViewProps {
  session: Session | null;
  permits: VisitorPermit[];
  onFastTrack: (type: 'food' | 'package' | 'cab') => Promise<void>;
  onPreRegisterGuest: (formData: { visitorName: string; vehicleNumber: string; flatNumber: string; durationHours: number }) => Promise<VisitorPermit | undefined>;
  onCancelPass: (permitId: string) => Promise<void>;
  onRegisterVehicle: (make: string, plate: string) => Promise<void>;
}

export function ResidentPortalView({
  session,
  permits,
  onFastTrack,
  onPreRegisterGuest,
  onCancelPass,
  onRegisterVehicle
}: ResidentPortalViewProps) {
  const [userTab, setUserTab] = useState<ResidentTab>('guests');
  const [notificationPermission, setNotificationPermission] = useState<string>(
    'Notification' in window ? Notification.permission : 'denied'
  );

  const [favorites, setFavorites] = useState<FavoriteVisitor[]>(() => {
    const stored = localStorage.getItem('pm_favorites');
    return stored ? JSON.parse(stored) : [];
  });
  const [isAddingFav, setIsAddingFav] = useState(false);
  const [newFavName, setNewFavName] = useState('');
  const [newFavVehicle, setNewFavVehicle] = useState('');

  useEffect(() => {
    localStorage.setItem('pm_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const [isRegisteringVehicle, setIsRegisteringVehicle] = useState(false);
  const [newVehicleMake, setNewVehicleMake] = useState('');
  const [newVehiclePlate, setNewVehiclePlate] = useState('');

  const [showGeneratePass, setShowGeneratePass] = useState(false);
  const [selectedPermitQR, setSelectedPermitQR] = useState<VisitorPermit | null>(null);
  const [showAllPasses, setShowAllPasses] = useState(false);

  const userId = session?.user?.id || 'guest';
  const userPermits = permits.filter(p => (p.user_id === userId || !p.user_id) && !p.qrCode.startsWith('RES-'));
  const userVehicles = permits.filter(p => p.qrCode.startsWith('RES-') && (p.user_id === userId || !p.user_id));
  const visiblePermits = showAllPasses ? userPermits : userPermits.slice(0, 3);
  const hasPermits = userPermits.length > 0;
  const hasMorePermits = userPermits.length > 3;

  const handleAddFavorite = (e: React.FormEvent) => {
    e.preventDefault();
    const newFav: FavoriteVisitor = {
      id: Math.random().toString(36).substr(2, 9),
      name: newFavName,
      vehicleNumber: newFavVehicle,
      userId
    };
    setFavorites(prev => [...prev, newFav]);
    setNewFavName('');
    setNewFavVehicle('');
    setIsAddingFav(false);
    toast.success(`${newFavName} added to favorites!`);
  };

  const handleRemoveFavorite = (favId: string) => {
    setFavorites(prev => prev.filter(f => f.id !== favId));
    toast.success('Removed from favorites');
  };

  const handleFavoritePass = async (fav: FavoriteVisitor) => {
    const expiryHours = 24;
    const permit = await onPreRegisterGuest({
      visitorName: fav.name,
      vehicleNumber: fav.vehicleNumber || 'TBD',
      flatNumber: 'Resident',
      durationHours: expiryHours
    });
    if (permit) {
      setSelectedPermitQR(permit);
      toast.success(`Pass generated for ${fav.name}`);
    }
  };

  const handleFormSubmitGuest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const visitorName = formData.get('visitorName') as string;
    const vehicleNumber = formData.get('vehicleNumber') as string;
    const durationHours = parseInt(formData.get('duration') as string, 10) || 4;

    const permit = await onPreRegisterGuest({
      visitorName,
      vehicleNumber,
      flatNumber: 'Resident-Guest',
      durationHours
    });
    if (permit) {
      setSelectedPermitQR(permit);
      setShowGeneratePass(false);
    }
  };

  const handleFormSubmitVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onRegisterVehicle(newVehicleMake, newVehiclePlate);
    setNewVehicleMake('');
    setNewVehiclePlate('');
    setIsRegisteringVehicle(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--color-border-subtle)] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-display font-bold tracking-tight">Resident Portal</h2>
            <button 
              onClick={() => {
                if ('Notification' in window && Notification.permission !== 'granted') {
                  Notification.requestPermission().then(perm => setNotificationPermission(perm));
                } else if (Notification.permission === 'granted') {
                  new Notification('Test Notification', { body: 'This is what an arrival alert looks like!' });
                  toast.success('Test notification sent!');
                }
              }}
              className={`p-2 rounded-full transition-colors ${notificationPermission === 'granted' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'}`}
              title={notificationPermission === 'granted' ? 'Notifications Active (Click to Test)' : 'Enable Notifications'}
            >
              {notificationPermission === 'granted' ? <BellRing size={20} /> : <Bell size={20} />}
            </button>
          </div>
          <p className="text-[var(--color-text-ghost)]">Manage your gate access, frequent guests, and personal passes.</p>
        </div>
        <div className="flex bg-[var(--color-bg-raised)] p-1 rounded-xl border border-[var(--color-border-subtle)] w-full sm:w-auto">
          <button 
            onClick={() => setUserTab('guests')} 
            className={`flex-1 px-4 py-2 text-sm font-bold rounded-lg transition-colors ${userTab === 'guests' ? 'bg-[var(--color-bg-card)] shadow-sm text-[var(--color-text-primary)]' : 'text-[var(--color-text-ghost)] hover:text-white'}`}
          >
            Guests
          </button>
          <button 
            onClick={() => setUserTab('vehicles')} 
            className={`flex-1 px-4 py-2 text-sm font-bold rounded-lg transition-colors ${userTab === 'vehicles' ? 'bg-[var(--color-bg-card)] shadow-sm text-[var(--color-text-primary)]' : 'text-[var(--color-text-ghost)] hover:text-white'}`}
          >
            My Vehicles
          </button>
          <button 
            onClick={() => setUserTab('support')} 
            className={`flex-1 px-4 py-2 text-sm font-bold rounded-lg transition-colors ${userTab === 'support' ? 'bg-[var(--color-bg-card)] shadow-sm text-[var(--color-text-primary)]' : 'text-[var(--color-text-ghost)] hover:text-white'}`}
          >
            Support
          </button>
        </div>
      </div>

      {userTab === 'guests' && (
        <div className="space-y-8">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[var(--color-text-ghost)] uppercase tracking-wider">1-Click Fast Track</h3>
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => onFastTrack('food')} 
                className="glass-panel p-4 flex flex-col items-center gap-2 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all group shadow-sm hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--color-bg-raised)] flex items-center justify-center group-hover:bg-[var(--color-accent)]/10">
                  <Utensils size={18} />
                </div>
                <span className="text-xs font-bold text-center">Food<br/>Delivery</span>
              </button>
              <button 
                onClick={() => onFastTrack('package')} 
                className="glass-panel p-4 flex flex-col items-center gap-2 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all group shadow-sm hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--color-bg-raised)] flex items-center justify-center group-hover:bg-[var(--color-accent)]/10">
                  <Package size={18} />
                </div>
                <span className="text-xs font-bold text-center">Package<br/>Delivery</span>
              </button>
              <button 
                onClick={() => onFastTrack('cab')} 
                className="glass-panel p-4 flex flex-col items-center gap-2 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all group shadow-sm hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--color-bg-raised)] flex items-center justify-center group-hover:bg-[var(--color-accent)]/10">
                  <Car size={18} />
                </div>
                <span className="text-xs font-bold text-center">Cab /<br/>Uber</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-[var(--color-text-ghost)] uppercase tracking-wider flex items-center gap-2">
                <Star size={14} className="text-[var(--color-accent)]" /> Frequent Visitors
              </h3>
              <button 
                onClick={() => setIsAddingFav(!isAddingFav)}
                className="text-xs font-bold text-[var(--color-accent)] hover:opacity-80 transition-opacity"
              >
                {isAddingFav ? 'Cancel' : '+ Add New'}
              </button>
            </div>
            
            {isAddingFav && (
              <div className="glass-panel p-4 mb-4">
                <form onSubmit={handleAddFavorite} className="flex flex-col gap-3">
                  <input 
                    type="text" 
                    value={newFavName} 
                    onChange={e => setNewFavName(e.target.value)} 
                    placeholder="Visitor Name (e.g. John - Cleaner)" 
                    className="bg-[var(--color-bg-raised)] border border-[var(--color-border-subtle)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-border-focus)]"
                    required
                  />
                  <input 
                    type="text" 
                    value={newFavVehicle} 
                    onChange={e => setNewFavVehicle(e.target.value)} 
                    placeholder="Vehicle (Optional)" 
                    className="bg-[var(--color-bg-raised)] border border-[var(--color-border-subtle)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-border-focus)]"
                  />
                  <button type="submit" className="bg-[var(--color-text-primary)] text-[var(--color-bg-page)] text-sm font-bold py-2 rounded-lg">
                    Save Favorite
                  </button>
                </form>
              </div>
            )}

            {favorites.filter(f => f.userId === userId).length === 0 && !isAddingFav ? (
              <div className="text-center p-6 border border-dashed border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-ghost)]">
                <p className="text-sm mb-2">No frequent visitors saved</p>
                <button onClick={() => setIsAddingFav(true)} className="text-xs font-bold text-[var(--color-accent)]">Add your first favorite</button>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
                {favorites.filter(f => f.userId === userId).map(fav => (
                  <div key={fav.id} className="glass-panel p-4 flex flex-col justify-between shrink-0 w-40 relative group">
                    <button 
                      onClick={() => {
                        if (window.confirm('Remove from favorites?')) {
                          handleRemoveFavorite(fav.id);
                        }
                      }}
                      className="absolute top-2 right-2 text-[var(--color-text-ghost)] opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                    <div>
                      <div className="w-8 h-8 rounded-full bg-[var(--color-bg-raised)] flex items-center justify-center mb-2">
                        <User size={14} className="text-[var(--color-text-ghost)]" />
                      </div>
                      <p className="text-sm font-bold truncate pr-4">{fav.name}</p>
                      <p className="text-[10px] text-[var(--color-text-ghost)] truncate">{fav.vehicleNumber || 'No Vehicle'}</p>
                    </div>
                    <button 
                      onClick={() => handleFavoritePass(fav)}
                      className="mt-3 w-full bg-[var(--color-bg-raised)] hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]/30 text-xs font-bold py-1.5 rounded transition-colors"
                    >
                      Create Pass
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-[var(--color-text-ghost)] uppercase tracking-wider">Guest Passes</h3>
              <button 
                onClick={() => setShowGeneratePass(!showGeneratePass)}
                className="bg-[var(--color-accent)] text-[var(--color-accent-fg)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] rounded flex items-center justify-center hover:opacity-90 transition-all shadow-sm shadow-[var(--color-accent)]/20"
              >
                {showGeneratePass ? 'View List' : '+ Custom Pass'}
              </button>
            </div>

            {showGeneratePass || !hasPermits ? (
              <div className="glass-panel p-6 sm:p-10 max-w-md mx-auto mt-4">
                <div className="text-center space-y-2 mb-8">
                  <h3 className="text-2xl font-display font-bold tracking-tight">New Guest Pass</h3>
                  <p className="text-[var(--color-text-ghost)] text-sm">Enter guest details to generate a QR pass.</p>
                </div>
                <form onSubmit={handleFormSubmitGuest} className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-label">GUEST NAME</label>
                    <input required name="visitorName" type="text" className="input-minimal w-full bg-[var(--color-bg-raised)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-sm focus:bg-[var(--color-bg-card)] focus:shadow-sm transition-all" placeholder="John Doe" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-label">VEHICLE NUMBER</label>
                    <input required name="vehicleNumber" type="text" className="input-minimal w-full bg-[var(--color-bg-raised)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-sm font-mono focus:bg-[var(--color-bg-card)] focus:shadow-sm transition-all" placeholder="ABC-1234" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-label">EXPECTED DURATION (HOURS)</label>
                    <input required name="duration" type="number" min="1" max="72" defaultValue="4" className="input-minimal w-full bg-[var(--color-bg-raised)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-sm font-mono focus:bg-[var(--color-bg-card)] focus:shadow-sm transition-all" />
                  </div>
                  <div className="pt-4 flex justify-end">
                    <button type="submit" className="w-full bg-[var(--color-accent)] text-[var(--color-accent-fg)] px-8 py-4 text-[12px] font-bold uppercase tracking-[0.08em] rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[var(--color-accent)]/20">
                      GENERATE PASS
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex flex-col">
                <AnimatePresence initial={false}>
                  {visiblePermits.map((permit, index) => (
                    <motion.div 
                      key={permit.id}
                      layout
                      initial={{ opacity: 0, height: 0, x: -40 }}
                      animate={{ opacity: 1, height: 'auto', x: 0 }}
                      exit={{ opacity: 0, height: 0, scale: 0.9 }}
                      transition={{ 
                        duration: 0.35, 
                        type: 'spring', 
                        bounce: 0,
                        opacity: { delay: index * 0.08 },
                        x: { delay: index * 0.08 },
                        height: { delay: index * 0.08 }
                      }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="pb-3">
                        <div className="glass-panel p-4 flex items-center justify-between group hover:border-[var(--color-border-focus)] transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-raised)] flex items-center justify-center border border-[var(--color-border-subtle)] shrink-0 text-[var(--color-text-ghost)]">
                              {permit.visitorName === 'Food Delivery' ? <Utensils size={20} /> :
                               permit.visitorName === 'Package Delivery' ? <Package size={20} /> :
                               permit.visitorName === 'Cab / Taxi' ? <Car size={20} /> :
                               <User size={20} />}
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                <h4 className="font-bold text-sm sm:text-base leading-none">{permit.visitorName}</h4>
                                <StatusBadge status={permit.status} />
                              </div>
                              <p className="text-[var(--color-text-ghost)] text-xs sm:text-sm mt-1">
                                {permit.vehicleNumber === 'ANY' ? 'Fast-Track Entry' : permit.vehicleNumber} • Valid till {formatTime(permit.expiryTime)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <button 
                              onClick={() => setSelectedPermitQR(permit)} 
                              className="p-2 bg-[var(--color-bg-raised)] hover:bg-[var(--color-bg-card)] rounded-lg hover:text-[var(--color-accent)] transition-colors border border-transparent hover:border-[var(--color-border-subtle)]" 
                              title="Show QR Code"
                            >
                              <QrCode size={18} />
                            </button>
                            {(permit.status === 'pending' || permit.status === 'active') && (
                              <button 
                                onClick={() => onCancelPass(permit.id)} 
                                className="p-2 bg-[var(--color-bg-raised)] hover:bg-red-500/20 text-[var(--color-text-ghost)] hover:text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-500/30" 
                                title="Revoke Pass"
                              >
                                <X size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {hasMorePermits && (
                  <button 
                    onClick={() => setShowAllPasses(!showAllPasses)}
                    className="w-full py-3 mt-2 text-sm font-bold text-[var(--color-text-ghost)] hover:text-white bg-[var(--color-bg-raised)] border border-[var(--color-border-subtle)] rounded-xl hover:border-[var(--color-border-focus)] transition-all flex items-center justify-center gap-2"
                  >
                    {showAllPasses ? (
                      <>Show Less <ChevronUp size={16} /></>
                    ) : (
                      <>Show {userPermits.length - 3} More <ChevronDown size={16} /></>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {userTab === 'vehicles' && (
        <div className="space-y-6">
          {!isRegisteringVehicle ? (
            <>
              {userVehicles.length === 0 ? (
                <div className="glass-panel p-10 text-center space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-[var(--color-bg-raised)] rounded-full flex items-center justify-center mx-auto border border-[var(--color-border-subtle)] text-[var(--color-text-ghost)]">
                    <Car size={24} />
                  </div>
                  <h3 className="text-xl font-bold">No Vehicles Registered</h3>
                  <p className="text-[var(--color-text-ghost)] text-sm">
                    Register your personal vehicles for automatic gate access. They will appear as permanent resident passes.
                  </p>
                  <button 
                    onClick={() => setIsRegisteringVehicle(true)}
                    className="bg-[var(--color-bg-raised)] border border-[var(--color-border-subtle)] px-6 py-3 rounded-xl text-sm font-bold hover:bg-[var(--color-bg-card)] transition-colors mt-4 shadow-sm"
                  >
                    + Register New Vehicle
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold">Registered Vehicles ({userVehicles.length})</h3>
                    <button 
                      onClick={() => setIsRegisteringVehicle(true)}
                      className="text-sm font-bold bg-[var(--color-text-primary)] text-[var(--color-bg-page)] px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                    >
                      + Add Vehicle
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userVehicles.map(vehicle => (
                      <div key={vehicle.id} className="glass-panel p-5 flex items-center justify-between group hover:border-[var(--color-border-focus)] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-raised)] flex items-center justify-center border border-[var(--color-border-subtle)] shrink-0">
                            <Car size={20} className="text-[var(--color-accent)]" />
                          </div>
                          <div>
                            <h4 className="font-bold">{vehicle.visitorName.replace('Resident: ', '')}</h4>
                            <p className="text-[10px] font-mono text-[var(--color-text-ghost)] mt-1 bg-[var(--color-bg-raised)] inline-block px-2 py-0.5 rounded border border-[var(--color-border-subtle)]">
                              {vehicle.vehicleNumber}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedPermitQR(vehicle)}
                          className="w-10 h-10 rounded-full bg-[var(--color-bg-raised)] border border-[var(--color-border-subtle)] flex items-center justify-center text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)] transition-colors hover:scale-105 active:scale-95 shadow-sm"
                          title="Show Gate Pass"
                        >
                          <QrCode size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="glass-panel p-8 max-w-md mx-auto relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--color-accent)]"></div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Register Vehicle</h3>
                <button 
                  onClick={() => { setIsRegisteringVehicle(false); setNewVehicleMake(''); setNewVehiclePlate(''); }}
                  className="p-2 hover:bg-[var(--color-bg-raised)] rounded-full transition-colors text-[var(--color-text-ghost)] hover:text-[var(--color-text-primary)]"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleFormSubmitVehicle} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-ghost)]">Vehicle Make & Model</label>
                  <input
                    type="text"
                    value={newVehicleMake}
                    onChange={(e) => setNewVehicleMake(e.target.value)}
                    placeholder="e.g. Toyota Camry Black"
                    className="w-full bg-[var(--color-bg-raised)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-ghost)]">License Plate</label>
                  <input
                    type="text"
                    value={newVehiclePlate}
                    onChange={(e) => setNewVehiclePlate(e.target.value)}
                    placeholder="e.g. ABC 1234"
                    className="w-full bg-[var(--color-bg-raised)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-border-focus)] font-mono transition-colors uppercase"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-[var(--color-text-primary)] text-[var(--color-bg-page)] py-3 rounded-xl font-bold mt-2 shadow-sm hover:opacity-90 transition-opacity"
                >
                  Complete Registration
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {userTab === 'support' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div 
            onClick={() => toast.success('Message sent to Security Desk')} 
            className="glass-panel p-8 text-center space-y-4 hover:border-[var(--color-border-focus)] transition-colors cursor-pointer group"
          >
            <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto border border-blue-500/20 group-hover:scale-110 transition-transform">
              <MessageSquare size={24} />
            </div>
            <h3 className="font-bold">Contact Security Guard</h3>
            <p className="text-[var(--color-text-ghost)] text-sm">Send a direct message to the main gate for general inquiries.</p>
          </div>
          <div 
            onClick={() => toast.error('Emergency Alert Triggered!', { style: { backgroundColor: 'var(--color-status-error)', color: '#fff' } })} 
            className="glass-panel p-8 text-center space-y-4 hover:border-red-500/50 transition-colors cursor-pointer group"
          >
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20 group-hover:scale-110 transition-transform">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-red-500">Emergency Alert</h3>
            <p className="text-[var(--color-text-ghost)] text-sm">Instantly notify all guards and administration of an emergency.</p>
          </div>
        </div>
      )}

      <QRCodeModal 
        permit={selectedPermitQR} 
        onClose={() => setSelectedPermitQR(null)} 
      />
    </div>
  );
}
