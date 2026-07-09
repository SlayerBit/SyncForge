package com.syncforge.module.realtime.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketBroadcastMessage implements Serializable {
    private String destination;
    private String username;
    private Object payload;
}
