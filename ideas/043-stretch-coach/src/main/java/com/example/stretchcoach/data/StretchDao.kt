package com.example.stretchcoach.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface StretchDao {
    @Insert suspend fun insert(session: StretchSession): Long

    @Query("SELECT * FROM stretch_sessions ORDER BY timestamp DESC LIMIT 100")
    fun observeRecent(): Flow<List<StretchSession>>

    @Query("SELECT COUNT(*) FROM stretch_sessions WHERE timestamp >= :sinceMillis")
    suspend fun countSince(sinceMillis: Long): Int
}
