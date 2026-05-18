package com.example.grocerylist.data

import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GroceryRepository @Inject constructor(
    private val dao: GroceryDao,
    private val parser: VoiceParser,
    private val dictionary: CategoryDictionary
) {
    fun observeItems(): Flow<List<GroceryItem>> = dao.observeAll()

    suspend fun addFromVoice(transcript: String): Int {
        val items = parser.parse(transcript)
        items.forEach {
            dao.insert(GroceryItem(
                name = it.name,
                category = dictionary.categorize(it.name),
                quantity = it.quantity,
                unit = it.unit
            ))
        }
        return items.size
    }

    suspend fun toggle(item: GroceryItem) {
        dao.update(item.copy(checked = !item.checked))
    }

    suspend fun clearChecked() = dao.clearChecked()
}
