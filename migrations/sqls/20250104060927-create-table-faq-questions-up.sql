create table if not exists faq_questions (
    id serial not null primary key,
    question varchar(255) null,
    faq_id int null,
	is_active boolean not null default true,
    created_at timestamp default current_timestamp,
    created_by int null,
    updated_at timestamp null,
    updated_by int null,
    constraint fk_faq_questions_faq_id foreign key (faq_id) references faqs (id) on update set null on delete set null,
    constraint fk_faq_questions_created_by foreign key (created_by) references users (id) on update set null on delete set null,
    constraint fk_faq_questions_updated_by foreign key (updated_by) references users (id) on update set null on delete set null
);

create index if not exists idx_faq_questions_faq_id on faq_questions (faq_id);
create index if not exists idx_faq_questions_created_at on faq_questions (created_at);
