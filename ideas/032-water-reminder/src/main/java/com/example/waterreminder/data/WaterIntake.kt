package com.example.waterreminder.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "water_intake")
data class WaterIntake(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val amountMl: Int,
    val containerType: String,
    val date: String, // yyyy-MM-dd
    val timestamp: Long = System.currentTimeMillis()
)
