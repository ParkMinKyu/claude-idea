package com.example.plantcare.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "plants")
data class Plant(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val species: String,
    val wateringIntervalDays: Int,
    val lastWateredMillis: Long = 0L,
    val photoPath: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "care_logs")
data class CareLog(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val plantId: Long,
    val action: String, // water | fertilize | repot
    val timestamp: Long = System.currentTimeMillis(),
    val note: String? = null
)
