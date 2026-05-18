package com.example.grocerylist.data

import javax.inject.Inject
import javax.inject.Singleton

data class VoiceItem(val name: String, val quantity: Int, val unit: String?)

@Singleton
class VoiceParser @Inject constructor() {
    private val splitRegex = Regex("\\s*[,，·\\s]+그리고\\s*|\\s*[,，·]\\s*|\\s+그리고\\s+")
    private val qtyRegex = Regex("(\\d+)(개|병|봉|kg|g|l|ml)?")

    fun parse(transcript: String): List<VoiceItem> {
        if (transcript.isBlank()) return emptyList()
        return transcript.split(splitRegex)
            .map { it.trim() }
            .filter { it.isNotEmpty() }
            .map { token ->
                val qty = qtyRegex.find(token)
                if (qty != null) {
                    val name = token.replace(qtyRegex, "").trim().ifBlank { token }
                    VoiceItem(name = name, quantity = qty.groupValues[1].toInt(),
                        unit = qty.groupValues[2].ifEmpty { null })
                } else {
                    VoiceItem(name = token, quantity = 1, unit = null)
                }
            }
    }
}
