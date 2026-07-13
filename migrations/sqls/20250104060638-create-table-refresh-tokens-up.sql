create table if not exists refresh_tokens (
	id serial not null primary key,
    user_id int null,
    user_agent varchar null,
    ip_address varchar null,
    token text null,
    expired_at timestamp null,
    created_at timestamp default current_timestamp,
    updated_at timestamp null,
    constraint fk_refresh_tokens_user_id foreign key (user_id) references users(id) on delete set null on update set null
);

create unique index if not exists idx_refresh_tokens_user_id ON refresh_tokens (user_id);
create index if not exists idx_refresh_tokens_created_at on refresh_tokens (created_at);
