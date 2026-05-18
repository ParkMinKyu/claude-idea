package com.example.publictransit.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "favorite_stops")
data class FavoriteStop(
    @PrimaryKey val stopId: String,
    val name: String,
    val type: String, // bus | subway
    val routeNumbers: String, // comma-separated
    val alias: String? = null,
    val addedAt: Long = System.currentTimeMillis()
)
