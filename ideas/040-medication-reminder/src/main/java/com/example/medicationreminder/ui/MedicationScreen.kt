package com.example.medicationreminder.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun MedicationScreen(viewModel: MedicationViewModel) {
    val meds by viewModel.meds.collectAsStateWithLifecycle()
    val low by viewModel.lowStock.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) { viewModel.refreshLowStock() }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("나의 약", style = MaterialTheme.typography.headlineMedium)
        if (low.isNotEmpty()) {
            Text("재고 부족: ${low.joinToString { it.name }}", color = MaterialTheme.colorScheme.error)
        }
        LazyColumn {
            items(meds, key = { it.id }) { m ->
                Card(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                    Row(Modifier.padding(12.dp)) {
                        Column(Modifier.weight(1f)) {
                            Text(m.name)
                            Text("재고: ${m.stockCount}정")
                        }
                        Button(onClick = { viewModel.take(m.id) }) { Text("복용") }
                    }
                }
            }
        }
    }
}
