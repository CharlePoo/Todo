using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OhYeah.Models
{

    public class SourceDestinationTodoModel { 
        public TodoModel Source { get; set; }
        public TodoModel Destination { get; set; }
    }

    public class TodoModel
    {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Required]
        public Guid Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        public string Name { get; set; }

        [NotMapped]
        public List<TaskModel> TaskList { get; set; }

    }

    public class TaskModel
    {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Required]
        public Guid Id { get; set; }

        [Required]
        public Guid TodoId { get; set; }

        [Required]
        public string Content { get; set; }

        [Required]
        public int Index { get; set; }


    }
}
