import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = "admin" | "user" | "tutor";

interface UserRoleData {
  role: AppRole;
  isTutorApproved: boolean;
  tutorRequestedAt: string | null;
}

export const useUserRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isTutorApproved, setIsTutorApproved] = useState(false);
  const [tutorRequestedAt, setTutorRequestedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoleData = useCallback(async () => {
    if (!user) {
      setRoles([]);
      setIsTutorApproved(false);
      setTutorRequestedAt(null);
      setLoading(false);
      return;
    }

    try {
      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (rolesError) throw rolesError;
      
      const userRoles = (rolesData || []).map((r) => r.role as AppRole);
      setRoles(userRoles);

      // Fetch tutor approval status if user is a tutor
      if (userRoles.includes("tutor")) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("is_tutor_approved, tutor_requested_at")
          .eq("user_id", user.id)
          .single();

        if (!profileError && profileData) {
          setIsTutorApproved(profileData.is_tutor_approved || false);
          setTutorRequestedAt(profileData.tutor_requested_at);
        }
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRoleData();
  }, [fetchRoleData]);

  const isAdmin = roles.includes("admin");
  const isTutor = roles.includes("tutor");
  const isStudent = roles.includes("user");
  const isApprovedTutor = isTutor && isTutorApproved;
  const isPendingTutor = isTutor && !isTutorApproved;

  return {
    roles,
    isAdmin,
    isTutor,
    isStudent,
    isApprovedTutor,
    isPendingTutor,
    isTutorApproved,
    tutorRequestedAt,
    loading,
    refetch: fetchRoleData,
  };
};
