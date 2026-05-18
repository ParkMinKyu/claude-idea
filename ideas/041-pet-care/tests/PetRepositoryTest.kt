package com.example.petcare

import com.example.petcare.data.PetDao
import com.example.petcare.data.PetRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class PetRepositoryTest {
    private val dao = mockk<PetDao>(relaxed = true)
    private val repo = PetRepository(dao)

    @Test
    fun `addPet rejects blank name`() = runTest {
        assertFailsWith<IllegalArgumentException> { repo.addPet("  ", "dog") }
    }

    @Test
    fun `addPet rejects unknown species`() = runTest {
        assertFailsWith<IllegalArgumentException> { repo.addPet("뽀삐", "unicorn") }
    }

    @Test
    fun `addDiary requires at least one field`() = runTest {
        assertFailsWith<IllegalArgumentException> {
            repo.addDiary(1, "2026-05-18", "")
        }
    }

    @Test
    fun `addDiary inserts when walkMin provided`() = runTest {
        coEvery { dao.insertEntry(any()) } returns 8L
        val id = repo.addDiary(1, "2026-05-18", "", walkMin = 30)
        assertEquals(8L, id)
        coVerify { dao.insertEntry(match { it.walkMinutes == 30 }) }
    }

    @Test
    fun `averageWalk returns 0 when null`() = runTest {
        coEvery { dao.averageWalkMinutes(1) } returns null
        assertEquals(0.0, repo.averageWalk(1), 0.001)
    }
}
