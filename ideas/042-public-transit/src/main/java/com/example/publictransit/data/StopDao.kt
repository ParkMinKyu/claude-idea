package com.example.publictransit.data

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface StopDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(stop: FavoriteStop)

    @Delete
    suspend fun delete(stop: FavoriteStop)

    @Query("SELECT * FROM favorite_stops ORDER BY addedAt DESC")
    fun observeAll(): Flow<List<FavoriteStop>>

    @Query("SELECT COUNT(*) FROM favorite_stops")
    suspend fun count(): Int
}
