package com.example.waterreminder

import app.cash.turbine.test
import com.example.waterreminder.data.HydrationRepository
import com.example.waterreminder.data.WaterIntake
import com.example.waterreminder.ui.HydrationViewModel
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
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class HydrationViewModelTest {

    private val repo = mockk<HydrationRepository>(relaxed = true)
    private val flow = MutableStateFlow<List<WaterIntake>>(emptyList())

    @Before fun setup() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        every { repo.observeToday() } returns flow
        every { repo.calculateDailyGoal(any(), any()) } returns 2400
    }

    @After fun teardown() { Dispatchers.resetMain() }

    @Test
    fun `totalMl sums all intakes`() = runTest {
        val vm = HydrationViewModel(repo)
        vm.uiState.test {
            awaitItem() // initial
            flow.value = listOf(
                WaterIntake(amountMl = 200, containerType = "컵", date = "2026-05-18"),
                WaterIntake(amountMl = 500, containerType = "텀블러", date = "2026-05-18"),
            )
            val state = awaitItem()
            assertEquals(700, state.totalMl)
            assertTrue(state.progress in 0f..1f)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `addCup delegates to repo`() = runTest {
        val vm = HydrationViewModel(repo)
        vm.addCup(250, "컵")
        coVerify { repo.addIntake(250, "컵") }
    }

    @Test
    fun `updateGoal uses formula from repository`() {
        val vm = HydrationViewModel(repo)
        vm.updateGoal(70, 2)
        // verified via mocked calculateDailyGoal stubbed to 2400
        coVerify { repo.calculateDailyGoal(70, 2) }
    }
}
