package com.example.moodjournal.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface MoodDao {
    @Insert suspend fun insert(entry: MoodEntry): Long

    @Query("SELECT * FROM mood_entries ORDER BY createdAt DESC")
    fun observeAll(): Flow<List<MoodEntry>>

    @Query("SELECT * FROM mood_entries WHERE date >= :since ORDER BY date ASC")
    suspend fun since(since: String): List<MoodEntry>

    @Query("SELECT AVG(score) FROM mood_entries WHERE date >= :since")
    suspend fun averageSince(since: String): Double?
}
