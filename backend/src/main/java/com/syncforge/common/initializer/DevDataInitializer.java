package com.syncforge.common.initializer;

import com.syncforge.module.user.domain.User;
import com.syncforge.module.user.repository.UserRepository;
import com.syncforge.module.workspace.domain.Workspace;
import com.syncforge.module.workspace.domain.WorkspaceMember;
import com.syncforge.module.workspace.domain.WorkspaceRole;
import com.syncforge.module.workspace.repository.WorkspaceMemberRepository;
import com.syncforge.module.workspace.repository.WorkspaceRepository;
import com.syncforge.module.board.domain.Board;
import com.syncforge.module.board.domain.BoardColumn;
import com.syncforge.module.board.repository.BoardColumnRepository;
import com.syncforge.module.board.repository.BoardRepository;
import com.syncforge.module.task.domain.Priority;
import com.syncforge.module.task.domain.Task;
import com.syncforge.module.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class DevDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final BoardRepository boardRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final TaskRepository taskRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() == 0) {
            log.info("Database is empty. Starting development data seeding...");

            // 1. Create Demo User
            User demoUser = new User(
                    "demo@syncforge.com",
                    passwordEncoder.encode("Password123!"),
                    "Demo User"
            );
            demoUser.verifyEmail(); // Transition status from PENDING to ACTIVE
            userRepository.save(demoUser);
            log.info("Seeded Demo User: demo@syncforge.com");

            // 2. Create Demo Workspace
            Workspace workspace = new Workspace(
                    "Demo Workspace",
                    "demo-workspace",
                    "This is a pre-seeded workspace for exploring SyncForge features.",
                    demoUser
            );
            workspaceRepository.save(workspace);
            log.info("Seeded Demo Workspace");

            // 3. Create Workspace Member (Owner)
            WorkspaceMember ownerMember = new WorkspaceMember(
                    workspace,
                    demoUser,
                    WorkspaceRole.OWNER
            );
            workspaceMemberRepository.save(ownerMember);

            // 4. Create Demo Board
            Board board = new Board(
                    workspace,
                    "SyncForge Kanban",
                    "Explore your team's workflow and manage tasks.",
                    "SF"
            );
            boardRepository.save(board);
            log.info("Seeded Board: SyncForge Kanban");

            // 5. Create Default Columns
            BoardColumn toDoCol = new BoardColumn(board, "To Do", "a", null);
            BoardColumn inProgressCol = new BoardColumn(board, "In Progress", "b", null);
            BoardColumn doneCol = new BoardColumn(board, "Done", "c", null);
            
            boardColumnRepository.save(toDoCol);
            boardColumnRepository.save(inProgressCol);
            boardColumnRepository.save(doneCol);
            log.info("Seeded default board columns");

            // 6. Create Initial Tasks
            Task task1 = new Task(
                    toDoCol,
                    board,
                    "Configure local development environment",
                    "Configure local settings, check Docker Compose and .env mappings.",
                    Priority.HIGH,
                    "a",
                    "SF-1",
                    demoUser,
                    LocalDate.now().plusDays(2)
            );
            board.incrementTaskSequence();

            Task task2 = new Task(
                    inProgressCol,
                    board,
                    "Explore SyncForge Kanban boards",
                    "Perform task movement, check @mentions in comments, and read logs.",
                    Priority.MEDIUM,
                    "a",
                    "SF-2",
                    demoUser,
                    LocalDate.now().plusDays(5)
            );
            board.incrementTaskSequence();

            Task task3 = new Task(
                    doneCol,
                    board,
                    "Perform production readiness audit",
                    "Run validation sweeps and write setup guides.",
                    Priority.LOW,
                    "a",
                    "SF-3",
                    demoUser,
                    LocalDate.now().minusDays(1)
            );
            board.incrementTaskSequence();

            taskRepository.save(task1);
            taskRepository.save(task2);
            taskRepository.save(task3);
            
            boardRepository.save(board); // Update task sequence count
            log.info("Seeded demo Kanban tasks");
            log.info("Development data seeding completed successfully.");
        } else {
            log.info("Database already contains data. Skipping development seeding.");
        }
    }
}
