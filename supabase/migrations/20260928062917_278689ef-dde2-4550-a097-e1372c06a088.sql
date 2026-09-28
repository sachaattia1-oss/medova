ALTER TABLE public.active_sessions DROP CONSTRAINT active_sessions_pkey;
ALTER TABLE public.active_sessions ADD PRIMARY KEY (user_id, session_key);