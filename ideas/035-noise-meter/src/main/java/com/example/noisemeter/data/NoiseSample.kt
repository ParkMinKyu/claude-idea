package com.example.noisemeter.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "noise_samples")
data class NoiseSample(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val db: Double,
    val latitude: Double?,
    val longitude: Double?,
    val timestamp: Long = System.currentTimeMillis(),
    val submitted: Boolean = false
)
