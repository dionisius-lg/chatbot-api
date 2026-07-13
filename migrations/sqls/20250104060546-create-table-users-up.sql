create table if not exists users (
	id serial not null primary key,
	username varchar(20) not null,
	password varchar(255) not null,
	fullname varchar(100) null,
	is_active boolean not null default true,
	created_at timestamp default current_timestamp,
	created_by int default 1,
	updated_at timestamp default null,
	updated_by int default 1
);

create unique index if not exists idx_username on users (username);
create index if not exists idx_users_created_at on users (created_at);
create index if not exists idx_users_created_by on users (created_by);
