package com.example.habittracker.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface HabitDao {
    @Query("SELECT * FROM habits ORDER BY createdAt DESC")
    fun observeAll(): Flow<List<Habit>>

    @Insert
    suspend fun insert(habit: Habit): Long

    @Insert
    suspend fun insertLog(log: HabitLog)

    @Query("SELECT COUNT(*) FROM habit_logs WHERE habitId = :habitId AND date = :date")
    suspend fun countForDate(habitId: Long, date: String): Int

    @Query("SELECT DISTINCT date FROM habit_logs WHERE habitId = :habitId ORDER BY date DESC")
    suspend fun datesFor(habitId: Long): List<String>
}
