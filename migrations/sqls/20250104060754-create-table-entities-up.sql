create table if not exists entities (
    id serial not null primary key,
    category varchar(50) null,
    intent varchar(50) null,
    language_id int null,
    sources text null,
	is_active boolean not null default true,
    created_at timestamp default current_timestamp,
    created_by int default null,
    updated_at timestamp default null,
    updated_by int default null,
    constraint fk_entities_language_id foreign key (language_id) references languages (id) on update set null on delete set null,
    constraint fk_entities_created_by foreign key (created_by) references users (id) on update set null on delete set null,
    constraint fk_entities_updated_by foreign key (updated_by) references users (id) on update set null on delete set null
);

create index if not exists idx_entities_language_id on entities (language_id);
create index if not exists idx_entities_created_at on entities (created_at);
