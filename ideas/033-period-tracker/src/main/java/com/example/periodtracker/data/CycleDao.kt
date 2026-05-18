package com.example.periodtracker.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface CycleDao {
    @Insert
    suspend fun insert(entry: CycleEntry): Long

    @Query("SELECT * FROM cycle_entries ORDER BY startDate DESC")
    fun observeAll(): Flow<List<CycleEntry>>

    @Query("SELECT * FROM cycle_entries ORDER BY startDate DESC LIMIT :limit")
    suspend fun lastN(limit: Int): List<CycleEntry>
}
