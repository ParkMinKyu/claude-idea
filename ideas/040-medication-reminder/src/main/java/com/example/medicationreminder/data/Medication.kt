package com.example.medicationreminder.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "medications")
data class Medication(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val doseMg: Double,
    val timesPerDay: Int, // 1..6
    val stockCount: Int,
    val refillThreshold: Int = 5,
    val firstHourOfDay: Int = 8 // first dose hour
)

@Entity(tableName = "intake_logs")
data class IntakeLog(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val medicationId: Long,
    val takenAt: Long = System.currentTimeMillis(),
    val confirmed: Boolean = true
)
