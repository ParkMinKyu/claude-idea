package com.example.plantcare.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun PlantScreen(viewModel: PlantViewModel) {
    val plants by viewModel.plants.collectAsStateWithLifecycle()
    var name by remember { mutableStateOf("") }
    var species by remember { mutableStateOf("") }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("나의 식물", style = MaterialTheme.typography.headlineMedium)
        OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("식물 이름") })
        OutlinedTextField(value = species, onValueChange = { species = it }, label = { Text("종") })
        Button(onClick = {
            viewModel.addPlant(name, species, 7)
            name = ""; species = ""
        }) { Text("식물 추가") }
        Spacer(Modifier.height(16.dp))
        LazyColumn {
            items(plants, key = { it.id }) { p ->
                Card(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                    Row(Modifier.padding(12.dp)) {
                        Text("${p.name} (${p.species})", modifier = Modifier.weight(1f))
                        Text("D-${viewModel.daysUntil(p)}")
                        Spacer(Modifier.width(8.dp))
                        Button(onClick = { viewModel.water(p.id) }) { Text("물주기") }
                    }
                }
            }
        }
    }
}
