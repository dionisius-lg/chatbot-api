insert into users (username, password, fullname, is_active, created_at, created_by)
values ('dion', '$2b$10$3EGJaP4g6.dHlkto1teppef6svxstq1Z0QX5SQhrR9IjnBcJX63P.', 'Dionisius', true, current_timestamp, 1)
on conflict (username)
do update set
    password = excluded.password,
    fullname = excluded.fullname,
    is_active = excluded.is_active,
    created_at = excluded.created_at,
    created_by = excluded.created_by;
