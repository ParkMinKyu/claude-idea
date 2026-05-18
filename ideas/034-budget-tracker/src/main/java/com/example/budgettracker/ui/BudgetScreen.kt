package com.example.budgettracker.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun BudgetScreen(viewModel: BudgetViewModel) {
    val txs by viewModel.transactions.collectAsStateWithLifecycle()
    val summary by viewModel.summary.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) { viewModel.refreshSummary() }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("이번 달 지출", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(8.dp))
        summary.forEach {
            Text("${it.category}: ${it.total}원")
        }
        Divider(Modifier.padding(vertical = 12.dp))
        LazyColumn {
            items(txs, key = { it.id }) { tx ->
                ListItem(headlineContent = { Text("${tx.merchant} ${tx.amount}원") },
                    supportingContent = { Text("${tx.category} · ${tx.date}") })
            }
        }
    }
}
