package com.example.medicationreminder.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface MedicationDao {
    @Insert suspend fun insert(med: Medication): Long
    @Update suspend fun update(med: Medication)
    @Insert suspend fun insertLog(log: IntakeLog)

    @Query("SELECT * FROM medications ORDER BY name")
    fun observeAll(): Flow<List<Medication>>

    @Query("SELECT * FROM medications WHERE id = :id")
    suspend fun getById(id: Long): Medication?

    @Query("SELECT * FROM medications WHERE stockCount <= refillThreshold")
    suspend fun lowStock(): List<Medication>
}
