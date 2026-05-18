package com.example.habittracker

import app.cash.turbine.test
import com.example.habittracker.data.Habit
import com.example.habittracker.data.HabitRepository
import com.example.habittracker.ui.HabitViewModel
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Test
import kotlin.test.assertEquals

@OptIn(ExperimentalCoroutinesApi::class)
class HabitViewModelTest {

    private val repo = mockk<HabitRepository>(relaxed = true)
    private val flow = MutableStateFlow<List<Habit>>(emptyList())

    @Before
    fun setup() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        every { repo.observeHabits() } returns flow
    }

    @After
    fun tearDown() { Dispatchers.resetMain() }

    @Test
    fun `habits flow emits values from repository`() = runTest {
        val vm = HabitViewModel(repo)
        vm.habits.test {
            assertEquals(emptyList(), awaitItem())
            flow.value = listOf(Habit(id = 1, name = "Run"))
            assertEquals(1, awaitItem().size)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `addHabit ignores blank input`() = runTest {
        val vm = HabitViewModel(repo)
        vm.addHabit("   ")
        coVerify(exactly = 0) { repo.addHabit(any(), any()) }
    }

    @Test
    fun `checkIn delegates to repository`() = runTest {
        coEvery { repo.checkIn(any(), any()) } returns Unit
        val vm = HabitViewModel(repo)
        vm.checkIn(42L)
        coVerify { repo.checkIn(42L) }
    }
}
