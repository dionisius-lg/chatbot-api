create table if not exists faqs (
    id serial not null primary key,
    category varchar(50) null,
    intent varchar(50) null,
    language_id int null,
	is_active boolean not null default true,
    created_at timestamp default current_timestamp,
    created_by int null,
    updated_at timestamp default null,
    updated_by int null,
    constraint fk_faqs_language_id foreign key (language_id) references languages (id) on update set null on delete set null,
    constraint fk_faqs_created_by foreign key (created_by) references users (id) on update set null on delete set null,
    constraint fk_faqs_updated_by foreign key (updated_by) references users (id) on update set null on delete set null
);

create index if not exists idx_faqs_language_id on faqs (language_id);
create index if not exists idx_faqs_created_at on faqs (created_at);
