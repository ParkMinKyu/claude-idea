package com.example.grocerylist

import com.example.grocerylist.data.CategoryDictionary
import com.example.grocerylist.data.GroceryDao
import com.example.grocerylist.data.GroceryRepository
import com.example.grocerylist.data.VoiceParser
import io.mockk.coVerify
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Test
import kotlin.test.assertEquals

class VoiceParserTest {
    private val parser = VoiceParser()

    @Test
    fun `parse splits by comma and space`() {
        val items = parser.parse("우유, 계란, 식빵")
        assertEquals(3, items.size)
        assertEquals("우유", items[0].name)
    }

    @Test
    fun `parse extracts quantity and unit`() {
        val items = parser.parse("우유 2병, 계란 10개")
        assertEquals(2, items[0].quantity)
        assertEquals("병", items[0].unit)
        assertEquals(10, items[1].quantity)
        assertEquals("개", items[1].unit)
    }

    @Test
    fun `parse returns empty on blank`() {
        assertEquals(emptyList(), parser.parse(""))
    }
}

class GroceryRepositoryTest {
    private val dao = mockk<GroceryDao>(relaxed = true)
    private val parser = VoiceParser()
    private val dict = CategoryDictionary()
    private val repo = GroceryRepository(dao, parser, dict)

    @Test
    fun `addFromVoice categorizes and inserts multiple items`() = runTest {
        coEvery { dao.insert(any()) } returns 1L
        val count = repo.addFromVoice("우유 1병, 사과 3개, 라면")
        assertEquals(3, count)
        coVerify { dao.insert(match { it.name == "우유" && it.category == "유제품" }) }
        coVerify { dao.insert(match { it.name == "사과" && it.category == "과일" }) }
    }
}
