package com.example.plantcare.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface PlantDao {
    @Insert suspend fun insert(plant: Plant): Long
    @Update suspend fun update(plant: Plant)
    @Insert suspend fun insertLog(log: CareLog)

    @Query("SELECT * FROM plants ORDER BY createdAt DESC")
    fun observePlants(): Flow<List<Plant>>

    @Query("SELECT * FROM plants WHERE id = :id")
    suspend fun getById(id: Long): Plant?
}
