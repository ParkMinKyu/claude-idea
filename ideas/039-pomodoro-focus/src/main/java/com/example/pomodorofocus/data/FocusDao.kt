package com.example.pomodorofocus.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface FocusDao {
    @Insert suspend fun insert(session: FocusSession): Long

    @Query("SELECT * FROM focus_sessions ORDER BY startMillis DESC")
    fun observeAll(): Flow<List<FocusSession>>

    @Query("SELECT COALESCE(SUM(durationMin), 0) FROM focus_sessions WHERE startMillis >= :sinceMillis AND completed = 1")
    suspend fun totalSince(sinceMillis: Long): Int
}
