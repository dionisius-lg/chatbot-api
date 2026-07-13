create table if not exists languages (
    id serial not null primary key,
    name varchar(100) null,
    native_name varchar(100) null,
    locale varchar(2) null,
	is_active boolean not null default true,
    created_at timestamp default current_timestamp,
    updated_at timestamp null
);

create unique index if not exists idx_languages_locale on languages (locale);
create index if not exists idx_languages_created_at on languages (created_at);
