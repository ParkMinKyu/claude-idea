package com.example.petcare.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface PetDao {
    @Insert suspend fun insertPet(pet: Pet): Long
    @Insert suspend fun insertEntry(entry: DiaryEntry): Long

    @Query("SELECT * FROM pets")
    fun observePets(): Flow<List<Pet>>

    @Query("SELECT * FROM diary_entries WHERE petId = :petId ORDER BY date DESC LIMIT :limit")
    suspend fun recentEntries(petId: Long, limit: Int = 30): List<DiaryEntry>

    @Query("SELECT AVG(walkMinutes) FROM diary_entries WHERE petId = :petId AND walkMinutes IS NOT NULL")
    suspend fun averageWalkMinutes(petId: Long): Double?
}
