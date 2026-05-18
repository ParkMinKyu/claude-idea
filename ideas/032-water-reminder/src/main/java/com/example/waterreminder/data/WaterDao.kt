package com.example.waterreminder.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface WaterDao {
    @Insert
    suspend fun insert(intake: WaterIntake)

    @Query("SELECT * FROM water_intake WHERE date = :date ORDER BY timestamp DESC")
    fun observeForDate(date: String): Flow<List<WaterIntake>>

    @Query("SELECT COALESCE(SUM(amountMl), 0) FROM water_intake WHERE date = :date")
    suspend fun totalForDate(date: String): Int
}
