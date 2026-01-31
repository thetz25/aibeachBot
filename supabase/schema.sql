-- Create the cars table
create table if not exists cars (
  id text primary key,
  name text not null,
  price numeric not null,
  dp_percent numeric default 0.20,
  type text,
  description text,
  image_url text,
  specs jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Turn on Row Level Security
alter table cars enable row level security;

-- Allow public read access (for the chatbot)
create policy "Public cars are viewable by everyone"
  on cars for select
  using ( true );

-- Allow authenticated (admin) full access
-- Note: You might need to adjust this depending on your auth setup. 
-- For now, if using service key in backend, it bypasses RLS.
-- If utilizing Supabase Auth on frontend, you need proper policies.
create policy "Users can insert their own cars"
  on cars for insert
  with check ( true ); 

create policy "Users can update cars"
  on cars for update
  using ( true );

create policy "Users can delete cars"
  on cars for delete
  using ( true );
