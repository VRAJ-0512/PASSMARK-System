import { useState, useEffect, useCallback, useMemo } from 'react';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { VisitorPermit, ParkingSlot, SystemLog, UserProfile } from '../types';
import { getTodayISO } from '../utils/dateUtils';

const todayISO = getTodayISO();

export const INITIAL_PERMITS: VisitorPermit[] = [
  {
    id: 'PM-8821',
    visitorName: 'Rahul Sharma',
    vehicleNumber: 'MH 01 AB 1234',
    flatNumber: 'B-1204',
    entryTime: `${todayISO}T10:30:00`,
    expiryTime: `${todayISO}T14:30:00`,
    status: 'active',
    entryStatus: 'in',
    qrCode: 'PM-8821-AUTH',
    slotId: 'A-01'
  },
  {
    id: 'PM-8822',
    visitorName: 'Priya Menon',
    vehicleNumber: 'MH 04 CK 5678',
    flatNumber: 'A-502',
    entryTime: `${todayISO}T11:15:00`,
    expiryTime: `${todayISO}T13:15:00`,
    status: 'active',
    entryStatus: 'in',
    qrCode: 'PM-8822-AUTH',
    slotId: 'A-02'
  }
];

export const INITIAL_SLOTS: ParkingSlot[] = Array.from({ length: 9 }, (_, i) => {
  const zone = i < 3 ? 'A' : i < 6 ? 'B' : 'C';
  const num = (i % 3) + 1;
  const id = `${zone}-${String(num).padStart(2, '0')}`;
  const isOccupied = i < 2;
  return {
    id,
    label: id,
    zone: zone as 'A' | 'B' | 'C',
    isOccupied,
    currentVehicle: i === 0 ? 'MH 01 AB 1234' : i === 1 ? 'MH 04 CK 5678' : undefined,
    permitId: i === 0 ? 'PM-8821' : i === 1 ? 'PM-8822' : undefined
  };
});

export function usePassmarkData(session: Session | null, setUserProfile: (profile: UserProfile | null) => void) {
  const [useSupabase, setUseSupabase] = useState(isSupabaseConfigured);
  const [permits, setPermits] = useState<VisitorPermit[]>(INITIAL_PERMITS);
  const [slots, setSlots] = useState<ParkingSlot[]>(INITIAL_SLOTS);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!useSupabase) {
      localStorage.setItem('pm_permits', JSON.stringify(permits));
    }
  }, [permits, useSupabase]);

  useEffect(() => {
    if (!useSupabase) {
      localStorage.setItem('pm_slots', JSON.stringify(slots));
    }
  }, [slots, useSupabase]);

  useEffect(() => {
    if (!useSupabase) {
      const savedPermits = localStorage.getItem('pm_permits');
      if (savedPermits) setPermits(JSON.parse(savedPermits));
      const savedSlots = localStorage.getItem('pm_slots');
      if (savedSlots) setSlots(JSON.parse(savedSlots));
      setIsLoading(false);
    }
  }, [useSupabase]);

  useEffect(() => {
    if (!useSupabase || !session) return;

    const fetchData = async () => {
      try {
        const fetchPromise = Promise.allSettled([
          supabase.from('permits').select('*').order('entryTime', { ascending: false }),
          supabase.from('slots').select('*').order('id', { ascending: true }),
          supabase.from('logs').select('*').order('created_at', { ascending: false }),
          supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        ]);

        const timeoutPromise = new Promise<'TIMEOUT'>((resolve) =>
          setTimeout(() => resolve('TIMEOUT'), 15000)
        );

        const raceResult = await Promise.race([fetchPromise, timeoutPromise]);

        if (raceResult === 'TIMEOUT') {
          console.warn('Supabase fetch timed out; using local cached data as fallback');
          const savedPermits = localStorage.getItem('pm_permits');
          if (savedPermits) setPermits(JSON.parse(savedPermits));
          const savedSlots = localStorage.getItem('pm_slots');
          if (savedSlots) setSlots(JSON.parse(savedSlots));
          return;
        }

        const [permitsRes, slotsRes, logsRes, profileRes] = raceResult;

        if (profileRes.status === 'fulfilled' && profileRes.value.data) {
          setUserProfile(profileRes.value.data as UserProfile);
        } else if (session.user) {
          const email = session.user.email || 'user@passmark.sys';
          const role = (session.user.user_metadata?.role as 'admin' | 'user') ||
            (email.includes('operator') || email.includes('admin') ? 'admin' : 'user');
          setUserProfile({
            id: session.user.id,
            email,
            role
          });
        }

        if (permitsRes.status === 'fulfilled' && permitsRes.value.data && permitsRes.value.data.length > 0) {
          setPermits(permitsRes.value.data as VisitorPermit[]);
        } else {
          const savedPermits = localStorage.getItem('pm_permits');
          if (savedPermits) setPermits(JSON.parse(savedPermits));
        }

        if (slotsRes.status === 'fulfilled' && slotsRes.value.data && slotsRes.value.data.length > 0) {
          setSlots(slotsRes.value.data as ParkingSlot[]);
        } else {
          const savedSlots = localStorage.getItem('pm_slots');
          if (savedSlots) {
            setSlots(JSON.parse(savedSlots));
          } else {
            setSlots(INITIAL_SLOTS);
          }
        }

        if (logsRes.status === 'fulfilled' && logsRes.value.data) {
          setLogs(logsRes.value.data as SystemLog[]);
        }
      } catch (error: any) {
        console.error('Error fetching data from Supabase:', error);
        const savedPermits = localStorage.getItem('pm_permits');
        if (savedPermits) setPermits(JSON.parse(savedPermits));
        const savedSlots = localStorage.getItem('pm_slots');
        if (savedSlots) setSlots(JSON.parse(savedSlots));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    const permitsSubscription = supabase
      .channel('permits-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'permits' }, payload => {
        if (payload.eventType === 'INSERT') {
          setPermits(prev => {
            if (prev.some(p => p.id === payload.new.id)) return prev;
            return [payload.new as VisitorPermit, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          const newRecord = payload.new as VisitorPermit;
          setPermits(prev => {
            const oldRecordLocal = prev.find(p => p.id === newRecord.id);

            if (oldRecordLocal && newRecord.user_id === session?.user?.id && oldRecordLocal.entryStatus === 'out' && newRecord.entryStatus === 'in') {
              toast.success(`${newRecord.visitorName} has arrived at the gate!`, {
                duration: 10000,
                description: `Vehicle: ${newRecord.vehicleNumber}`
              });
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Guest Arrived', { body: `${newRecord.visitorName} (Vehicle: ${newRecord.vehicleNumber}) has just been scanned in.` });
              }
            }

            return prev.map(p => p.id === newRecord.id ? newRecord : p);
          });
        } else if (payload.eventType === 'DELETE') {
          setPermits(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe();

    const slotsSubscription = supabase
      .channel('slots-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slots' }, payload => {
        if (payload.eventType === 'UPDATE') {
          setSlots(prev => prev.map(s => s.id === payload.new.id ? payload.new as ParkingSlot : s));
        } else if (payload.eventType === 'INSERT') {
          setSlots(prev => {
            if (prev.some(s => s.id === payload.new.id)) return prev;
            const newSlots = [...prev, payload.new as ParkingSlot];
            return newSlots.sort((a, b) => a.id.localeCompare(b.id));
          });
        } else if (payload.eventType === 'DELETE') {
          setSlots(prev => prev.filter(s => s.id !== payload.old.id));
        }
      })
      .subscribe();

    const logsSubscription = supabase
      .channel('logs-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs' }, payload => {
        setLogs(prev => {
          if (prev.some(l => l.id === payload.new.id)) return prev;
          return [payload.new as SystemLog, ...prev];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(permitsSubscription);
      supabase.removeChannel(slotsSubscription);
      supabase.removeChannel(logsSubscription);
    };
  }, [useSupabase, session, setUserProfile]);

  const logEvent = useCallback(async (type: SystemLog['type'], details: string, ref_id?: string, status: SystemLog['status'] = 'SUCCESS') => {
    const newLog: Omit<SystemLog, 'id'> = {
      created_at: new Date().toISOString(),
      type,
      details,
      ref_id,
      status
    };

    if (useSupabase) {
      try {
        await supabase.from('logs').insert([newLog]);
      } catch (err: any) {
        console.error('Failed to insert log:', err);
        toast.error(`Failed to save activity log: ${err.message || 'Unknown error'}`);
      }
    } else {
      const logWithId: SystemLog = { ...newLog, id: Math.random().toString(36).substr(2, 9) };
      setLogs(prev => [logWithId, ...prev]);
    }
  }, [useSupabase]);

  const stats = useMemo(() => {
    const active = permits.filter(p => p.status === 'active').length;
    const available = slots.filter(s => !s.isOccupied).length;

    const completedPermits = permits.filter(p => {
      if (!p.checkOutTime || !p.entryTime) return false;
      const stayDuration = new Date(p.checkOutTime).getTime() - new Date(p.entryTime).getTime();
      return stayDuration > 0 && stayDuration < 24 * 60 * 60 * 1000;
    });

    let avgStay = "2h 05m";
    if (completedPermits.length > 0) {
      const totalStayMs = completedPermits.reduce((acc, p) => {
        const start = new Date(p.entryTime).getTime();
        const end = new Date(p.checkOutTime!).getTime();
        return acc + (end - start);
      }, 0);
      const avgMs = totalStayMs / completedPermits.length;
      const hours = Math.floor(avgMs / (1000 * 60 * 60));
      const minutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
      avgStay = hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;
    }

    const alerts = permits.filter(p => p.status === 'overstay').length;
    return { active, available, avgStay, alerts };
  }, [permits, slots]);

  const handleCreatePermit = useCallback(async (formData: { name: string; vehicle: string; flat: string; slotId: string }) => {
    const { name, vehicle, flat, slotId } = formData;
    const permitId = `PM-${Math.floor(8800 + Math.random() * 1199)}`;

    const newPermit: VisitorPermit = {
      id: permitId,
      visitorName: name,
      vehicleNumber: vehicle,
      flatNumber: flat,
      entryTime: new Date().toISOString(),
      expiryTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      entryStatus: 'out',
      qrCode: `${permitId}-AUTH-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      slotId: slotId
    };

    setPermits(prev => [newPermit, ...prev]);

    setSlots(prev => prev.map(s =>
      s.id === slotId
        ? { ...s, isOccupied: true, currentVehicle: vehicle, permitId: permitId }
        : s
    ));

    logEvent('ENTRY', `Permit created: ${newPermit.visitorName} (${vehicle}) -> Flat ${newPermit.flatNumber}`, permitId);

    if (useSupabase) {
      try {
        await supabase.from('permits').insert([newPermit]);
        await supabase.from('slots').update({
          isOccupied: true,
          currentVehicle: vehicle,
          permitId: permitId
        }).eq('id', slotId);
      } catch (error: any) {
        console.error('Error creating permit in Supabase:', error);
        toast.error(`Failed to issue permit: ${error.message || 'Unknown error'}`);
      }
    }
    toast.success('Permit issued successfully.');
    return newPermit;
  }, [useSupabase, logEvent]);

  const handlePreRegisterGuest = useCallback(async (formData: { visitorName: string; vehicleNumber: string; flatNumber: string; durationHours: number }) => {
    const { visitorName, vehicleNumber, flatNumber, durationHours } = formData;
    const permitId = `PM-${Math.floor(8800 + Math.random() * 1199)}`;

    const newPermit: VisitorPermit = {
      id: permitId,
      visitorName,
      vehicleNumber,
      flatNumber,
      entryTime: new Date().toISOString(),
      expiryTime: new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      entryStatus: 'out',
      qrCode: `${permitId}-AUTH-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      user_id: session?.user?.id
    };

    setPermits(prev => [newPermit, ...prev]);
    logEvent('SYSTEM', `Pre-registered visitor: ${newPermit.visitorName}`, permitId);

    if (useSupabase) {
      try {
        await supabase.from('permits').insert([newPermit]);
      } catch (error: any) {
        console.error('Error creating pre-registered permit in Supabase:', error);
        toast.error(`Failed to pre-register permit: ${error.message || 'Unknown error'}`);
      }
    }
    toast.success('Permit pre-registered successfully.');
    return newPermit;
  }, [useSupabase, session, logEvent]);

  const handleCheckIn = useCallback(async (permitId: string) => {
    const permit = permits.find(p => p.id === permitId);
    if (!permit) return;

    let slotId = permit.slotId;
    let slotUpdates = null;

    if (!slotId) {
      const availableSlot = slots.find(s => !s.isOccupied);
      if (availableSlot) {
        slotId = availableSlot.id;
        slotUpdates = {
          isOccupied: true,
          currentVehicle: permit.vehicleNumber,
          permitId: permitId
        };
        setSlots(prev => prev.map(s => s.id === slotId ? { ...s, ...slotUpdates } : s));
      } else {
        toast.error("Allocation Failed", {
          description: "No parking slots available!"
        });
        return;
      }
    }

    const now = new Date();
    const oldDuration = new Date(permit.expiryTime).getTime() - new Date(permit.entryTime).getTime();
    const newExpiryTime = new Date(now.getTime() + oldDuration).toISOString();
    const nowIso = now.toISOString();

    setPermits(prev => prev.map(p =>
      p.id === permitId ? { ...p, entryStatus: 'in', status: 'active', slotId, entryTime: nowIso, expiryTime: newExpiryTime } : p
    ));

    logEvent('ENTRY', `Checked in: ${permit.visitorName} (${permit.vehicleNumber})`, permitId);

    if (!useSupabase && permit.user_id === session?.user?.id && permit.entryStatus === 'out') {
      toast.success(`${permit.visitorName} has arrived at the gate!`, {
        duration: 10000,
        description: `Vehicle: ${permit.vehicleNumber}`
      });
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Guest Arrived', { body: `${permit.visitorName} (Vehicle: ${permit.vehicleNumber}) has just been scanned in.` });
      }
    }

    if (useSupabase) {
      try {
        await supabase.from('permits').update({ entryStatus: 'in', status: 'active', slotId, entryTime: nowIso, expiryTime: newExpiryTime }).eq('id', permitId);
        if (slotUpdates) {
          await supabase.from('slots').update(slotUpdates).eq('id', slotId);
        }
      } catch (error: any) {
        console.error('Error updating check-in in Supabase:', error);
        toast.error(`Failed to process check-in: ${error.message || 'Unknown error'}`);
      }
    }
    toast.success('Vehicle checked in successfully.');
  }, [permits, slots, useSupabase, session, logEvent]);

  const handleCheckOut = useCallback(async (permitId: string) => {
    const permit = permits.find(p => p.id === permitId);
    if (!permit) return;

    const checkOutTime = new Date().toISOString();
    const newStatus = permit.qrCode.startsWith('RES-') ? 'active' : (permit.status === 'overstay' ? 'overstay' : 'expired');

    setPermits(prev => prev.map(p =>
      p.id === permitId ? { ...p, entryStatus: 'out', status: newStatus, checkOutTime } : p
    ));

    if (permit.slotId) {
      setSlots(prev => prev.map(s =>
        s.id === permit.slotId
          ? { ...s, isOccupied: false, currentVehicle: undefined, permitId: undefined }
          : s
      ));
    }

    logEvent('EXIT', `Checked out: ${permit.visitorName} (${permit.vehicleNumber})`, permitId);

    if (useSupabase) {
      try {
        await supabase.from('permits').update({
          entryStatus: 'out',
          status: newStatus,
          checkOutTime
        }).eq('id', permitId);

        if (permit.slotId) {
          await supabase.from('slots').update({
            isOccupied: false,
            currentVehicle: null,
            permitId: null
          }).eq('id', permit.slotId);
        }
      } catch (error: any) {
        console.error('Error updating check-out in Supabase:', error);
        toast.error(`Failed to process check-out: ${error.message || 'Unknown error'}`);
      }
    }
    toast.success('Vehicle checked out successfully.');
  }, [permits, useSupabase, logEvent]);

  const handleCancelPass = useCallback(async (permitId: string) => {
    setPermits(prev => prev.filter(p => p.id !== permitId));
    logEvent('SYSTEM', `Resident cancelled pass`, permitId);
    if (useSupabase) {
      try {
        await supabase.from('permits').delete().eq('id', permitId);
      } catch (error) {
        console.error('Error deleting permit:', error);
      }
    }
  }, [useSupabase, logEvent]);

  const handleFastTrack = useCallback(async (type: 'food' | 'package' | 'cab') => {
    let visitorName = '';
    const durationHours = 2;

    if (type === 'food') visitorName = 'Food Delivery';
    if (type === 'package') visitorName = 'Package Delivery';
    if (type === 'cab') visitorName = 'Cab / Taxi';

    const permitId = `PM-${Math.floor(8800 + Math.random() * 1199)}`;
    const newPermit: VisitorPermit = {
      id: permitId,
      visitorName,
      vehicleNumber: 'ANY',
      flatNumber: 'Resident-FastTrack',
      entryTime: new Date().toISOString(),
      expiryTime: new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      entryStatus: 'out',
      qrCode: `${permitId}-AUTH-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      user_id: session?.user?.id
    };

    setPermits(prev => [newPermit, ...prev]);
    toast.success(`${visitorName} pre-approved! Guard notified.`);
    logEvent('SYSTEM', `Fast-Track ${visitorName} created by resident`, permitId);

    if (useSupabase) {
      try {
        await supabase.from('permits').insert([newPermit]);
      } catch (error: any) {
        console.error('Error creating fast-track permit:', error);
      }
    }
  }, [session, useSupabase, logEvent]);

  const handleRegisterVehicle = useCallback(async (make: string, plate: string) => {
    const permitId = Math.random().toString(36).substr(2, 9).toUpperCase();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 10);

    const newPermit: VisitorPermit = {
      id: permitId,
      visitorName: `Resident: ${make}`,
      vehicleNumber: plate,
      flatNumber: 'Resident',
      entryTime: new Date().toISOString(),
      expiryTime: expiryDate.toISOString(),
      status: 'active',
      entryStatus: 'out',
      qrCode: `RES-${permitId}-AUTH-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      user_id: session?.user?.id
    };

    setPermits(prev => [newPermit, ...prev]);
    toast.success(`Vehicle ${make} registered successfully!`);
    logEvent('SYSTEM', `Resident registered personal vehicle: ${make}`, permitId);

    if (useSupabase) {
      try {
        await supabase.from('permits').insert([newPermit]);
      } catch (error: any) {
        console.error('Error creating vehicle pass:', error);
        toast.error(`Failed to sync vehicle pass to cloud.`);
      }
    }
  }, [session, useSupabase, logEvent]);

  const resetToNineSlots = useCallback(async () => {
    setIsLoading(true);
    try {
      if (useSupabase) {
        await supabase.from('slots').delete().neq('id', '0');
        const nineSlots = Array.from({ length: 9 }, (_, i) => {
          const zone = i < 3 ? 'A' : i < 6 ? 'B' : 'C';
          const num = (i % 3) + 1;
          const id = `${zone}-${String(num).padStart(2, '0')}`;
          return {
            id,
            label: id,
            zone: zone as 'A' | 'B' | 'C',
            isOccupied: false,
            currentVehicle: null,
            permitId: null
          };
        });

        await supabase.from('slots').insert(nineSlots);
        setSlots(nineSlots as ParkingSlot[]);
        toast.success('Successfully updated database to 9 slots!');
        return { text: 'Successfully updated database to 9 slots!', type: 'success' as const };
      } else {
        setSlots(INITIAL_SLOTS);
        toast.success('Updated local slots.');
        return { text: 'Updated local slots.', type: 'success' as const };
      }
    } catch (error: any) {
      console.error('Error resetting slots:', error);
      toast.error(`Failed to update slots: ${error.message || 'Unknown error'}`);
      return { text: `Failed to update slots: ${error.message || 'Unknown error'}`, type: 'error' as const };
    } finally {
      setIsLoading(false);
    }
  }, [useSupabase]);

  const resetData = useCallback(async () => {
    setIsLoading(true);
    try {
      setPermits(INITIAL_PERMITS);
      setSlots(INITIAL_SLOTS);

      if (useSupabase) {
        try {
          await supabase.from('permits').delete().neq('id', '0');
          for (const slot of INITIAL_SLOTS) {
            await supabase.from('slots').update({
              isOccupied: slot.isOccupied,
              currentVehicle: slot.currentVehicle || null,
              permitId: slot.permitId || null
            }).eq('id', slot.id);
          }
          if (INITIAL_PERMITS.length > 0) {
            await supabase.from('permits').insert(INITIAL_PERMITS);
          }
          toast.success('Successfully reset data to factory defaults.');
          return { text: 'Successfully reset data to factory defaults.', type: 'success' as const };
        } catch (err: any) {
          console.error('Error resetting data:', err);
          toast.error(`Failed to reset data: ${err.message || 'Unknown error'}`);
          return { text: `Failed to reset database: ${err.message || 'Unknown error'}`, type: 'error' as const };
        }
      } else {
        localStorage.removeItem('pm_permits');
        localStorage.removeItem('pm_slots');
        toast.success('Successfully reset local data.');
        return { text: 'Successfully reset local data.', type: 'success' as const };
      }
    } catch (error: any) {
      console.error('Error resetting data in Supabase:', error);
      toast.error(`Failed to reset database: ${error.message || 'Unknown error'}`);
      return { text: `Failed to reset database: ${error.message || 'Unknown error'}`, type: 'error' as const };
    } finally {
      setIsLoading(false);
    }
  }, [useSupabase]);

  return {
    permits,
    setPermits,
    slots,
    setSlots,
    logs,
    setLogs,
    stats,
    isLoading,
    useSupabase,
    setUseSupabase,
    logEvent,
    handleCreatePermit,
    handlePreRegisterGuest,
    handleCheckIn,
    handleCheckOut,
    handleCancelPass,
    handleFastTrack,
    handleRegisterVehicle,
    resetToNineSlots,
    resetData
  };
}
