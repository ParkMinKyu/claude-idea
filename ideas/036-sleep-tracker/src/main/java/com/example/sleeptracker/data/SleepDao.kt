package com.example.sleeptracker.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface SleepDao {
    @Insert
    suspend fun insertSession(session: SleepSession): Long

    @Insert
    suspend fun insertMovement(event: MovementEvent)

    @Query("SELECT * FROM sleep_sessions ORDER BY startMillis DESC")
    fun observeSessions(): Flow<List<SleepSession>>

    @Query("SELECT * FROM movements WHERE sessionId = :sessionId ORDER BY timestamp ASC")
    suspend fun movementsFor(sessionId: Long): List<MovementEvent>
}
