package com.example.noisemeter.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface NoiseDao {
    @Insert
    suspend fun insert(sample: NoiseSample): Long

    @Update
    suspend fun update(sample: NoiseSample)

    @Query("SELECT * FROM noise_samples ORDER BY timestamp DESC LIMIT 200")
    fun observeRecent(): Flow<List<NoiseSample>>

    @Query("SELECT AVG(db) FROM noise_samples WHERE timestamp >= :sinceMillis")
    suspend fun averageSince(sinceMillis: Long): Double?
}
