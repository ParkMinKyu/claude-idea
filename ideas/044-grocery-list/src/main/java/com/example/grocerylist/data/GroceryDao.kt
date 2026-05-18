package com.example.grocerylist.data

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface GroceryDao {
    @Insert suspend fun insert(item: GroceryItem): Long
    @Update suspend fun update(item: GroceryItem)
    @Delete suspend fun delete(item: GroceryItem)

    @Query("SELECT * FROM grocery_items ORDER BY checked ASC, category, createdAt DESC")
    fun observeAll(): Flow<List<GroceryItem>>

    @Query("DELETE FROM grocery_items WHERE checked = 1")
    suspend fun clearChecked()
}
