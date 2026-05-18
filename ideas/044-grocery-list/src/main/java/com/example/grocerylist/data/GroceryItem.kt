package com.example.grocerylist.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "grocery_items")
data class GroceryItem(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val category: String,
    val quantity: Int = 1,
    val unit: String? = null,
    val checked: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)
