using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using OhYeah.Data;
using OhYeah.Models;
using System.Security.Claims;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace OhYeah.API
{
    [Route("api/[controller]")]
    [ApiController]
    public class TodoController : ControllerBase
    {
        private IServiceScopeFactory scopeFactory;
        public TodoController(IServiceScopeFactory _scopeFactory)
        {
            scopeFactory = _scopeFactory;
        }
        // GET: api/<ValuesController>
        [HttpGet]
        public List<TodoModel> Get()
        {

            using (var scope = scopeFactory.CreateScope())
            {
                var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var dbContext = scope.ServiceProvider.GetRequiredService<IdentityContext>();

                //just manually pulling it, I did not implement relationships
                var todoList = dbContext.Todo.Where(x => x.UserId == new Guid(id));
                var to = dbContext.Task.Where(x => todoList.Any(t => t.Id == x.TodoId)).ToList();
                foreach (var item in todoList)
                {
                    item.TaskList = to.Where(x=>x.TodoId==item.Id).OrderBy(x=>x.Index).ToList();
                }

                return todoList.ToList();
            }
        }

        // GET api/<ValuesController>/5
        [HttpGet("{id}")]
        public async Task<TodoModel> Get(Guid id)
        {
            using (var scope = scopeFactory.CreateScope())
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var dbContext = scope.ServiceProvider.GetRequiredService<IdentityContext>();
                return await dbContext.Todo.FirstOrDefaultAsync(x => x.Id == id);
            }
        }

        // POST api/<ValuesController>
        [HttpPost]
        public void Post([FromBody] TodoModel value)
        {
            using (var scope = scopeFactory.CreateScope())
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var dbContext = scope.ServiceProvider.GetRequiredService<IdentityContext>();
                //return await dbContext.Todo.FirstOrDefaultAsync(x => x.UserId == new Guid(userId));
                value.UserId = new Guid(userId);

                dbContext.Todo.Add(value);
                dbContext.SaveChanges();

            }
        }

        // PUT api/<ValuesController>/5
        [HttpPut]
        public async Task Put([FromBody] TodoModel value)
        {

            using (var scope = scopeFactory.CreateScope())
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var dbContext = scope.ServiceProvider.GetRequiredService<IdentityContext>();
                var todo = await dbContext.Todo.FirstOrDefaultAsync(x=>x.Id==value.Id && x.UserId==new Guid(userId));
                if (todo != null)
                {
                    todo.Name = value.Name;
                    dbContext.SaveChanges();
                }
            }
        }

        // DELETE api/<ValuesController>/5
        [HttpDelete("{id}")]
        public async Task Delete(Guid id)
        {
            using (var scope = scopeFactory.CreateScope())
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var dbContext = scope.ServiceProvider.GetRequiredService<IdentityContext>();
                var todo = await dbContext.Todo.FirstOrDefaultAsync(x => x.Id == id && x.UserId == new Guid(userId));
                if (todo!=null)
                {
                    dbContext.Todo.Remove(todo);
                    dbContext.Task.RemoveRange(dbContext.Task.Where(x => x.TodoId == id).AsEnumerable());
                    await dbContext.SaveChangesAsync();
                }
            }
        }



        [Route("UpdateAll")]
        [HttpPost]
        public async Task UpdateAll([FromBody] SourceDestinationTodoModel todo)
        {

            using (var scope = scopeFactory.CreateScope())
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var dbContext = scope.ServiceProvider.GetRequiredService<IdentityContext>();

                var taskList = dbContext.Task.Where(x => x.TodoId == todo.Source.Id || x.TodoId == todo.Destination.Id).ToList();

                UpdateTaskItem(todo.Source, taskList);

                if (todo.Source.Id!=todo.Destination.Id)
                    UpdateTaskItem(todo.Destination, taskList);

                await dbContext.SaveChangesAsync();
            }
        }

        private void UpdateTaskItem(TodoModel todo, List<TaskModel> dbTaskList) {
            foreach (var item in todo.TaskList)
            {
                var task = dbTaskList.FirstOrDefault(x => x.Id == item.Id);
                if (task != null)
                {
                    task.TodoId = todo.Id;
                    task.Index = item.Index;
                }
            }
        }



    }
}
