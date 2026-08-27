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
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 10000)
        );

        const fetchPromise = Promise.all([
          supabase.from('permits').select('*').order('entryTime', { ascending: false }),
          supabase.from('slots').select('*').order('id', { ascending: true }),
          supabase.from('logs').select('*').order('created_at', { ascending: false }),
          supabase.from('profiles').select('*').eq('id', session.user.id).single()
        ]);

        const [permitsRes, slotsRes, logsRes, profileRes] = await Promise.race([fetchPromise, timeoutPromise]) as any;

        let hasMissingTables = false;

        if (profileRes && profileRes.data) {
          setUserProfile(profileRes.data);
        } else if (profileRes && profileRes.error) {
          console.error('Supabase profile error:', profileRes.error);
          if (profileRes.error.code === '42P01' || profileRes.error.code === 'PGRST205') hasMissingTables = true;
        }

        if (permitsRes.error) {
          console.error('Supabase permits error:', permitsRes.error);
          if (permitsRes.error.code === '42P01' || permitsRes.error.code === 'PGRST205') hasMissingTables = true;
        }
        if (slotsRes.error) {
          console.error('Supabase slots error:', slotsRes.error);
          if (slotsRes.error.code === '42P01' || slotsRes.error.code === 'PGRST205') hasMissingTables = true;
        }
        if (logsRes.error) {
          console.error('Supabase logs error:', logsRes.error);
          if (logsRes.error.code === '42P01' || logsRes.error.code === 'PGRST205') hasMissingTables = true;
        }

        if (hasMissingTables) {
          toast.error('Database tables are missing!', {
            description: 'Please run the updated SQL script in the Supabase SQL Editor.',
            duration: 10000
          });
        }

        if (permitsRes.data) setPermits(permitsRes.data as VisitorPermit[]);
        if (slotsRes.data && slotsRes.data.length > 0) setSlots(slotsRes.data as ParkingSlot[]);
        if (logsRes.data) setLogs(logsRes.data as SystemLog[]);
      } catch (error: any) {\n        console.error('Error fetching data from Supabase:', error);\n        toast.error(`Failed to load data: ${error.message || 'Unknown error'}. Falling back to local storage.`);\n        console.warn('Falling back to local storage mode.');\n        setUseSupabase(false);\n      } finally {\n        setIsLoading(false);\n      }\n    };\n\n    fetchData();\n\n    const permitsSubscription = supabase\n      .channel('permits-changes')\n      .on('postgres_changes', { event: '*', schema: 'public', table: 'permits' }, payload => {\n        if (payload.eventType === 'INSERT') {\n          setPermits(prev => {\n            if (prev.some(p => p.id === payload.new.id)) return prev;\n            return [payload.new as VisitorPermit, ...prev];\n          });\n        } else if (payload.eventType === 'UPDATE') {\n          const newRecord = payload.new as VisitorPermit;\n          setPermits(prev => {\n            const oldRecordLocal = prev.find(p => p.id === newRecord.id);\n\n            if (oldRecordLocal && newRecord.user_id === session?.user?.id && oldRecordLocal.entryStatus === 'out' && newRecord.entryStatus === 'in') {\n              toast.success(`${newRecord.visitorName} has arrived at the gate!`, {\n                duration: 10000,\n                description: `Vehicle: ${newRecord.vehicleNumber}`\n              });\n              if ('Notification' in window && Notification.permission === 'granted') {\n                new Notification('Guest Arrived', { body: `${newRecord.visitorName} (Vehicle: ${newRecord.vehicleNumber}) has just been scanned in.` });\n              }\n            }\n\n            return prev.map(p => p.id === newRecord.id ? newRecord : p);\n          });\n        } else if (payload.eventType === 'DELETE') {\n          setPermits(prev => prev.filter(p => p.id !== payload.old.id));\n        }\n      })\n      .subscribe();\n\n    const slotsSubscription = supabase\n      .channel('slots-changes')\n      .on('postgres_changes', { event: '*', schema: 'public', table: 'slots' }, payload => {\n        if (payload.eventType === 'UPDATE') {\n          setSlots(prev => prev.map(s => s.id === payload.new.id ? payload.new as ParkingSlot : s));\n        } else if (payload.eventType === 'INSERT') {\n          setSlots(prev => {\n            if (prev.some(s => s.id === payload.new.id)) return prev;\n            const newSlots = [...prev, payload.new as ParkingSlot];\n            return newSlots.sort((a, b) => a.id.localeCompare(b.id));\n          });\n        } else if (payload.eventType === 'DELETE') {\n          setSlots(prev => prev.filter(s => s.id !== payload.old.id));\n        }\n      })\n      .subscribe();\n\n    const logsSubscription = supabase\n      .channel('logs-changes')\n      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs' }, payload => {\n        setLogs(prev => {\n          if (prev.some(l => l.id === payload.new.id)) return prev;\n          return [payload.new as SystemLog, ...prev];\n        });\n      })\n      .subscribe();\n\n    return () => {\n      supabase.removeChannel(permitsSubscription);\n      supabase.removeChannel(slotsSubscription);\n      supabase.removeChannel(logsSubscription);\n    };\n  }, [useSupabase, session, setUserProfile]);\n\n  const logEvent = useCallback(async (type: SystemLog['type'], details: string, ref_id?: string, status: SystemLog['status'] = 'SUCCESS') => {\n    const newLog: Omit<SystemLog, 'id'> = {\n      created_at: new Date().toISOString(),\n      type,\n      details,\n      ref_id,\n      status\n    };\n\n    if (useSupabase) {\n      try {\n        await supabase.from('logs').insert([newLog]);\n      } catch (err: any) {\n        console.error('Failed to insert log:', err);\n        toast.error(`Failed to save activity log: ${err.message || 'Unknown error'}`);\n      }\n    } else {\n      const logWithId: SystemLog = { ...newLog, id: Math.random().toString(36).substr(2, 9) };\n      setLogs(prev => [logWithId, ...prev]);\n    }\n  }, [useSupabase]);\n\n  const stats = useMemo(() => {\n    const active = permits.filter(p => p.status === 'active').length;\n    const available = slots.filter(s => !s.isOccupied).length;\n\n    const completedPermits = permits.filter(p => {\n      if (!p.checkOutTime || !p.entryTime) return false;\n      const stayDuration = new Date(p.checkOutTime).getTime() - new Date(p.entryTime).getTime();\n      return stayDuration > 0 && stayDuration < 24 * 60 * 60 * 1000;\n    });\n\n    let avgStay = \"2h 05m\";\n    if (completedPermits.length > 0) {\n      const totalStayMs = completedPermits.reduce((acc, p) => {\n        const start = new Date(p.entryTime).getTime();\n        const end = new Date(p.checkOutTime!).getTime();\n        return acc + (end - start);\n      }, 0);\n      const avgMs = totalStayMs / completedPermits.length;\n      const hours = Math.floor(avgMs / (1000 * 60 * 60));\n      const minutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));\n      avgStay = hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;\n    }\n\n    const alerts = permits.filter(p => p.status === 'overstay').length;\n    return { active, available, avgStay, alerts };\n  }, [permits, slots]);\n\n  const handleCreatePermit = useCallback(async (formData: { name: string; vehicle: string; flat: string; slotId: string }) => {\n    const { name, vehicle, flat, slotId } = formData;\n    const permitId = `PM-${Math.floor(8800 + Math.random() * 1199)}`;\n\n    const newPermit: VisitorPermit = {\n      id: permitId,\n      visitorName: name,\n      vehicleNumber: vehicle,\n      flatNumber: flat,\n      entryTime: new Date().toISOString(),\n      expiryTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),\n      status: 'active',\n      entryStatus: 'out',\n      qrCode: `${permitId}-AUTH-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,\n      slotId: slotId\n    };\n\n    setPermits(prev => [newPermit, ...prev]);\n\n    setSlots(prev => prev.map(s =>\n      s.id === slotId\n        ? { ...s, isOccupied: true, currentVehicle: vehicle, permitId: permitId }\n        : s\n    ));\n\n    logEvent('ENTRY', `Permit created: ${newPermit.visitorName} (${vehicle}) -> Flat ${newPermit.flatNumber}`, permitId);\n\n    if (useSupabase) {\n      try {\n        await supabase.from('permits').insert([newPermit]);\n        await supabase.from('slots').update({\n          isOccupied: true,\n          currentVehicle: vehicle,\n          permitId: permitId\n        }).eq('id', slotId);\n      } catch (error: any) {\n        console.error('Error creating permit in Supabase:', error);\n        toast.error(`Failed to issue permit: ${error.message || 'Unknown error'}`);\n      }\n    }\n    toast.success('Permit issued successfully.');\n    return newPermit;\n  }, [useSupabase, logEvent]);\n\n  const handlePreRegisterGuest = useCallback(async (formData: { visitorName: string; vehicleNumber: string; flatNumber: string; durationHours: number }) => {\n    const { visitorName, vehicleNumber, flatNumber, durationHours } = formData;\n    const permitId = `PM-${Math.floor(8800 + Math.random() * 1199)}`;\n\n    const newPermit: VisitorPermit = {\n      id: permitId,\n      visitorName,\n      vehicleNumber,\n      flatNumber,\n      entryTime: new Date().toISOString(),\n      expiryTime: new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString(),\n      status: 'pending',\n      entryStatus: 'out',\n      qrCode: `${permitId}-AUTH-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,\n      user_id: session?.user?.id\n    };\n\n    setPermits(prev => [newPermit, ...prev]);\n    logEvent('SYSTEM', `Pre-registered visitor: ${newPermit.visitorName}`, permitId);\n\n    if (useSupabase) {\n      try {\n        await supabase.from('permits').insert([newPermit]);\n      } catch (error: any) {\n        console.error('Error creating pre-registered permit in Supabase:', error);\n        toast.error(`Failed to pre-register permit: ${error.message || 'Unknown error'}`);\n      }\n    }\n    toast.success('Permit pre-registered successfully.');\n    return newPermit;\n  }, [useSupabase, session, logEvent]);\n\n  const handleCheckIn = useCallback(async (permitId: string) => {\n    const permit = permits.find(p => p.id === permitId);\n    if (!permit) return;\n\n    let slotId = permit.slotId;\n    let slotUpdates = null;\n\n    if (!slotId) {\n      const availableSlot = slots.find(s => !s.isOccupied);\n      if (availableSlot) {\n        slotId = availableSlot.id;\n        slotUpdates = {\n          isOccupied: true,\n          currentVehicle: permit.vehicleNumber,\n          permitId: permitId\n        };\n        setSlots(prev => prev.map(s => s.id === slotId ? { ...s, ...slotUpdates } : s));\n      } else {\n        toast.error(\"Allocation Failed\", {\n          description: \"No parking slots available!\"\n        });\n        return;\n      }\n    }\n\n    const now = new Date();\n    const oldDuration = new Date(permit.expiryTime).getTime() - new Date(permit.entryTime).getTime();\n    const newExpiryTime = new Date(now.getTime() + oldDuration).toISOString();\n    const nowIso = now.toISOString();\n\n    setPermits(prev => prev.map(p =>\n      p.id === permitId ? { ...p, entryStatus: 'in', status: 'active', slotId, entryTime: nowIso, expiryTime: newExpiryTime } : p\n    ));\n\n    logEvent('ENTRY', `Checked in: ${permit.visitorName} (${permit.vehicleNumber})`, permitId);\n\n    if (!useSupabase && permit.user_id === session?.user?.id && permit.entryStatus === 'out') {\n      toast.success(`${permit.visitorName} has arrived at the gate!`, {\n        duration: 10000,\n        description: `Vehicle: ${permit.vehicleNumber}`\n      });\n      if ('Notification' in window && Notification.permission === 'granted') {\n        new Notification('Guest Arrived', { body: `${permit.visitorName} (Vehicle: ${permit.vehicleNumber}) has just been scanned in.` });\n      }\n    }\n\n    if (useSupabase) {\n      try {\n        await supabase.from('permits').update({ entryStatus: 'in', status: 'active', slotId, entryTime: nowIso, expiryTime: newExpiryTime }).eq('id', permitId);\n        if (slotUpdates) {\n          await supabase.from('slots').update(slotUpdates).eq('id', slotId);\n        }\n      } catch (error: any) {\n        console.error('Error updating check-in in Supabase:', error);\n        toast.error(`Failed to process check-in: ${error.message || 'Unknown error'}`);\n      }\n    }\n    toast.success('Vehicle checked in successfully.');\n  }, [permits, slots, useSupabase, session, logEvent]);\n\n  const handleCheckOut = useCallback(async (permitId: string) => {\n    const permit = permits.find(p => p.id === permitId);\n    if (!permit) return;\n\n    const checkOutTime = new Date().toISOString();\n    const newStatus = permit.qrCode.startsWith('RES-') ? 'active' : (permit.status === 'overstay' ? 'overstay' : 'expired');\n\n    setPermits(prev => prev.map(p =>\n      p.id === permitId ? { ...p, entryStatus: 'out', status: newStatus, checkOutTime } : p\n    ));\n\n    if (permit.slotId) {\n      setSlots(prev => prev.map(s =>\n        s.id === permit.slotId\n          ? { ...s, isOccupied: false, currentVehicle: undefined, permitId: undefined }\n          : s\n      ));\n    }\n\n    logEvent('EXIT', `Checked out: ${permit.visitorName} (${permit.vehicleNumber})`, permitId);\n\n    if (useSupabase) {\n      try {\n        await supabase.from('permits').update({\n          entryStatus: 'out',\n          status: newStatus,\n          checkOutTime\n        }).eq('id', permitId);\n\n        if (permit.slotId) {\n          await supabase.from('slots').update({\n            isOccupied: false,\n            currentVehicle: null,\n            permitId: null\n          }).eq('id', permit.slotId);\n        }\n      } catch (error: any) {\n        console.error('Error updating check-out in Supabase:', error);\n        toast.error(`Failed to process check-out: ${error.message || 'Unknown error'}`);\n      }\n    }\n    toast.success('Vehicle checked out successfully.');\n  }, [permits, useSupabase, logEvent]);\n\n  const handleCancelPass = useCallback(async (permitId: string) => {\n    setPermits(prev => prev.filter(p => p.id !== permitId));\n    logEvent('SYSTEM', `Resident cancelled pass`, permitId);\n    if (useSupabase) {\n      try {\n        await supabase.from('permits').delete().eq('id', permitId);\n      } catch (error) {\n        console.error('Error deleting permit:', error);\n      }\n    }\n  }, [useSupabase, logEvent]);\n\n  const handleFastTrack = useCallback(async (type: 'food' | 'package' | 'cab') => {\n    let visitorName = '';\n    const durationHours = 2;\n\n    if (type === 'food') visitorName = 'Food Delivery';\n    if (type === 'package') visitorName = 'Package Delivery';\n    if (type === 'cab') visitorName = 'Cab / Taxi';\n\n    const permitId = `PM-${Math.floor(8800 + Math.random() * 1199)}`;\n    const newPermit: VisitorPermit = {\n      id: permitId,\n      visitorName,\n      vehicleNumber: 'ANY',\n      flatNumber: 'Resident-FastTrack',\n      entryTime: new Date().toISOString(),\n      expiryTime: new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString(),\n      status: 'pending',\n      entryStatus: 'out',\n      qrCode: `${permitId}-AUTH-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,\n      user_id: session?.user?.id\n    };\n\n    setPermits(prev => [newPermit, ...prev]);\n    toast.success(`${visitorName} pre-approved! Guard notified.`);\n    logEvent('SYSTEM', `Fast-Track ${visitorName} created by resident`, permitId);\n\n    if (useSupabase) {\n      try {\n        await supabase.from('permits').insert([newPermit]);\n      } catch (error: any) {\n        console.error('Error creating fast-track permit:', error);\n      }\n    }\n  }, [session, useSupabase, logEvent]);\n\n  const handleRegisterVehicle = useCallback(async (make: string, plate: string) => {\n    const permitId = Math.random().toString(36).substr(2, 9).toUpperCase();\n    const expiryDate = new Date();\n    expiryDate.setFullYear(expiryDate.getFullYear() + 10);\n\n    const newPermit: VisitorPermit = {\n      id: permitId,\n      visitorName: `Resident: ${make}`,\n      vehicleNumber: plate,\n      flatNumber: 'Resident',\n      entryTime: new Date().toISOString(),\n      expiryTime: expiryDate.toISOString(),\n      status: 'active',\n      entryStatus: 'out',\n      qrCode: `RES-${permitId}-AUTH-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,\n      user_id: session?.user?.id\n    };\n\n    setPermits(prev => [newPermit, ...prev]);\n    toast.success(`Vehicle ${make} registered successfully!`);\n    logEvent('SYSTEM', `Resident registered personal vehicle: ${make}`, permitId);\n\n    if (useSupabase) {\n      try {\n        await supabase.from('permits').insert([newPermit]);\n      } catch (error: any) {\n        console.error('Error creating vehicle pass:', error);\n        toast.error(`Failed to sync vehicle pass to cloud.`);\n      }\n    }\n  }, [session, useSupabase, logEvent]);\n\n  const resetToNineSlots = useCallback(async () => {\n    setIsLoading(true);\n    try {\n      if (useSupabase) {\n        await supabase.from('slots').delete().neq('id', '0');\n        const nineSlots = Array.from({ length: 9 }, (_, i) => {\n          const zone = i < 3 ? 'A' : i < 6 ? 'B' : 'C';\n          const num = (i % 3) + 1;\n          const id = `${zone}-${String(num).padStart(2, '0')}`;\n          return {\n            id,\n            label: id,\n            zone: zone as 'A' | 'B' | 'C',\n            isOccupied: false,\n            currentVehicle: null,\n            permitId: null\n          };\n        });\n\n        await supabase.from('slots').insert(nineSlots);\n        setSlots(nineSlots as ParkingSlot[]);\n        toast.success('Successfully updated database to 9 slots!');\n        return { text: 'Successfully updated database to 9 slots!', type: 'success' as const };\n      } else {\n        setSlots(INITIAL_SLOTS);\n        toast.success('Updated local slots.');\n        return { text: 'Updated local slots.', type: 'success' as const };\n      }\n    } catch (error: any) {\n      console.error('Error resetting slots:', error);\n      toast.error(`Failed to update slots: ${error.message || 'Unknown error'}`);\n      return { text: `Failed to update slots: ${error.message || 'Unknown error'}`, type: 'error' as const };\n    } finally {\n      setIsLoading(false);\n    }\n  }, [useSupabase]);\n\n  const resetData = useCallback(async () => {\n    setIsLoading(true);\n    try {\n      setPermits(INITIAL_PERMITS);\n      setSlots(INITIAL_SLOTS);\n\n      if (useSupabase) {\n        try {\n          await supabase.from('permits').delete().neq('id', '0');\n          for (const slot of INITIAL_SLOTS) {\n            await supabase.from('slots').update({\n              isOccupied: slot.isOccupied,\n              currentVehicle: slot.currentVehicle || null,\n              permitId: slot.permitId || null\n            }).eq('id', slot.id);\n          }\n          if (INITIAL_PERMITS.length > 0) {\n            await supabase.from('permits').insert(INITIAL_PERMITS);\n          }\n          toast.success('Successfully reset data to factory defaults.');\n          return { text: 'Successfully reset data to factory defaults.', type: 'success' as const };\n        } catch (err: any) {\n          console.error('Error resetting data:', err);\n          toast.error(`Failed to reset data: ${err.message || 'Unknown error'}`);\n          return { text: `Failed to reset database: ${err.message || 'Unknown error'}`, type: 'error' as const };\n        }\n      } else {\n        localStorage.removeItem('pm_permits');\n        localStorage.removeItem('pm_slots');\n        toast.success('Successfully reset local data.');\n        return { text: 'Successfully reset local data.', type: 'success' as const };\n      }\n    } catch (error: any) {\n      console.error('Error resetting data in Supabase:', error);\n      toast.error(`Failed to reset database: ${error.message || 'Unknown error'}`);\n      return { text: `Failed to reset database: ${error.message || 'Unknown error'}`, type: 'error' as const };\n    } finally {\n      setIsLoading(false);\n    }\n  }, [useSupabase]);\n\n  return {\n    permits,\n    setPermits,\n    slots,\n    setSlots,\n    logs,\n    setLogs,\n    stats,\n    isLoading,\n    useSupabase,\n    setUseSupabase,\n    logEvent,\n    handleCreatePermit,\n    handlePreRegisterGuest,\n    handleCheckIn,\n    handleCheckOut,\n    handleCancelPass,\n    handleFastTrack,\n    handleRegisterVehicle,\n    resetToNineSlots,\n    resetData\n  };\n}\n