function Get-SupabaseMigrationMap {
  return @(
    [pscustomobject]@{
      Source = "sql/supabase_schema.sql"
      Version = "20260422000100"
      Name = "initial_schema"
      Target = "supabase/migrations/20260422000100_initial_schema.sql"
    }
    [pscustomobject]@{
      Source = "sql/supabase_room_mvp_migration.sql"
      Version = "20260422000200"
      Name = "room_mvp"
      Target = "supabase/migrations/20260422000200_room_mvp.sql"
    }
    [pscustomobject]@{
      Source = "sql/supabase_room_edit_lock_migration.sql"
      Version = "20260422000300"
      Name = "room_edit_lock"
      Target = "supabase/migrations/20260422000300_room_edit_lock.sql"
    }
    [pscustomobject]@{
      Source = "sql/supabase_room_arrival_updates_migration.sql"
      Version = "20260426000100"
      Name = "room_arrival_updates"
      Target = "supabase/migrations/20260426000100_room_arrival_updates.sql"
    }
    [pscustomobject]@{
      Source = "sql/supabase_room_cancel_timing_migration.sql"
      Version = "20260426000200"
      Name = "room_cancel_timing"
      Target = "supabase/migrations/20260426000200_room_cancel_timing.sql"
    }
  )
}
